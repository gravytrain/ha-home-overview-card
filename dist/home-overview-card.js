/**
 * Home Overview Card — Morning Dashboard
 * A personalized morning glance card for Home Assistant.
 * Shows weather, forecast, calendar, AI briefing, alerts, and system status.
 */

const HOME_CARD_VERSION = '0.1.0';

class HomeOverviewCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = {};
    this._briefing = null;
    this._briefingLoaded = false;
    this._prevWatchedStates = {};
  }

  setConfig(config) {
    this._config = {
      daystrom_url: config.daystrom_url || 'http://192.168.1.218:8090',
      show_briefing: config.show_briefing !== false,
      show_forecast: config.show_forecast !== false,
      show_calendar: config.show_calendar !== false,
      show_sun_moon: config.show_sun_moon !== false,
      show_air_quality: config.show_air_quality !== false,
      show_household_alerts: config.show_household_alerts !== false,
      show_needs_attention: config.show_needs_attention !== false,
      show_quick_stats: config.show_quick_stats !== false,
      show_systems: config.show_systems !== false,
      show_energy: config.show_energy !== false,
      show_cameras: config.show_cameras !== false,
      weather_entity: config.weather_entity || 'weather.home',
      calendar_entities: config.calendar_entities || [],
      aqi_entity: config.aqi_entity || 'sensor.airnow_aqi',
      pollen_entity: config.pollen_entity || '',
      sun_entity: config.sun_entity || 'sun.sun',
      moon_entity: config.moon_entity || 'sensor.moon_phase',
      packages_entity: config.packages_entity || '',
      waste_entity: config.waste_entity || '',
      person_entities: config.person_entities || [],
      camera_entities: config.camera_entities || [],
      system_entities: config.system_entities || [],
      door_entities: config.door_entities || [],
      energy_entities: config.energy_entities || [],
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    const oldHass = this._hass;
    this._hass = hass;

    if (!this._briefingLoaded && this._config.show_briefing) {
      this._briefingLoaded = true;
      this._loadBriefing();
      setInterval(() => this._loadBriefing(), 600000);
    }

    if (!this._forecastLoaded) {
      this._forecastLoaded = true;
      this._loadForecast();
      setInterval(() => this._loadForecast(), 1800000);
    }

    if (!oldHass) {
      this._render();
      return;
    }

    const watched = this._getWatchedEntities();
    const changed = watched.some(id =>
      oldHass.states[id] !== hass.states[id]
    );

    if (changed) this._render();
  }

  _getWatchedEntities() {
    const entities = [
      this._config.weather_entity,
      this._config.sun_entity,
      this._config.moon_entity,
      this._config.aqi_entity,
      this._config.pollen_entity,
      this._config.packages_entity,
      this._config.waste_entity,
      ...this._config.calendar_entities,
      ...this._config.person_entities,
      ...this._config.camera_entities,
      ...this._config.system_entities,
      ...this._config.door_entities,
      ...this._config.energy_entities,
    ];
    return entities.filter(Boolean);
  }

  async _loadBriefing() {
    try {
      const res = await fetch(`${this._config.daystrom_url}/api/briefings/latest`);
      if (res.ok) {
        const data = await res.json();
        this._briefing = data;
        this._renderBriefingSection();
      }
    } catch (err) {
      this._briefing = null;
    }
  }

  async _loadForecast() {
    if (!this._hass || !this._config.weather_entity) return;
    try {
      const result = await this._hass.callWS({
        type: 'weather/subscribe_forecast',
        forecast_type: 'hourly',
        entity_id: this._config.weather_entity,
      });
      if (result && result.forecast) {
        this._forecast = result.forecast;
        this._renderForecastSection();
      }
    } catch (err) {
      try {
        const result = await this._hass.callService('weather', 'get_forecasts', {
          type: 'hourly',
        }, { entity_id: this._config.weather_entity });
        const key = this._config.weather_entity;
        if (result?.response?.[key]?.forecast) {
          this._forecast = result.response[key].forecast;
          this._renderForecastSection();
        }
      } catch (err2) {
        this._forecast = null;
      }
    }
  }

  _renderForecastSection() {
    const container = this.shadowRoot?.querySelector('.forecast-row');
    if (!container) return;
    container.innerHTML = this._renderForecast();
  }

  _renderBriefingSection() {
    const container = this.shadowRoot?.querySelector('.briefing-content');
    if (!container) return;
    if (this._briefing && this._briefing.content) {
      container.innerHTML = `
        <p class="briefing-text">${this._briefing.content}</p>
        <div class="briefing-meta">
          <span class="briefing-source">Based on: ${this._briefing.sources || 'weather, calendar, sensors'}</span>
          <span class="briefing-time">Updated ${this._formatTime(this._briefing.created_at || this._briefing.createdAt)}</span>
        </div>
      `;
    } else {
      container.innerHTML = `<p class="briefing-placeholder">AI briefing will appear here once configured</p>`;
    }
  }

  _getGreeting() {
    const hour = new Date().getHours();
    const userName = this._hass?.user?.name || 'there';
    const firstName = userName.split(' ')[0];
    if (hour < 12) return `Good Morning, ${firstName}`;
    if (hour < 17) return `Good Afternoon, ${firstName}`;
    return `Good Evening, ${firstName}`;
  }

  _getWeatherIcon(state) {
    const icons = {
      'sunny': '☀️', 'clear-night': '🌙', 'partlycloudy': '⛅',
      'cloudy': '☁️', 'rainy': '🌧️', 'lightning-rainy': '⛈️',
      'snowy': '❄️', 'fog': '🌫️', 'windy': '💨', 'hail': '🌨️',
      'exceptional': '⚠️',
    };
    return icons[state] || '🌤️';
  }

  _getState(entityId) {
    if (!entityId || !this._hass || !this._hass.states[entityId]) return null;
    return this._hass.states[entityId];
  }

  _stateValue(entityId, fallback = '--') {
    const s = this._getState(entityId);
    return s ? s.state : fallback;
  }

  _formatTime(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  _formatDate() {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  }

  _renderForecast() {
    const forecast = this._forecast;
    if (!forecast || forecast.length === 0) {
      return '<div class="forecast-empty">Loading forecast...</div>';
    }

    const now = new Date();
    const upcoming = forecast.filter(f => new Date(f.datetime) > now).slice(0, 8);

    return upcoming.map(f => {
      const dt = new Date(f.datetime);
      const timeStr = dt.toLocaleTimeString('en-US', { hour: 'numeric' });
      const icon = this._getWeatherIcon(f.condition);
      const temp = Math.round(f.temperature);
      const rain = f.precipitation_probability || 0;
      return `
        <div class="forecast-hour">
          <span class="fh-time">${timeStr}</span>
          <span class="fh-icon">${icon}</span>
          <span class="fh-temp">${temp}°</span>
          ${rain > 0 ? `<span class="fh-rain">💧${rain}%</span>` : '<span class="fh-rain"></span>'}
        </div>
      `;
    }).join('');
  }

  _renderSunMoon() {
    const sun = this._getState(this._config.sun_entity);
    const moon = this._getState(this._config.moon_entity);

    const sunrise = sun?.attributes?.next_rising;
    const sunset = sun?.attributes?.next_setting;

    const sunriseStr = sunrise ? new Date(sunrise).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '--';
    const sunsetStr = sunset ? new Date(sunset).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '--';

    let daylightStr = '--';
    if (sunrise && sunset) {
      const riseMs = new Date(sunrise).getTime();
      const setMs = new Date(sunset).getTime();
      let diffMs = setMs - riseMs;
      if (diffMs < 0) diffMs += 86400000;
      const hours = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      daylightStr = `${hours}h ${mins}m`;
    }

    const moonPhase = moon ? moon.state.replace(/_/g, ' ') : '--';
    const moonIcons = {
      'new moon': '🌑', 'waxing crescent': '🌒', 'first quarter': '🌓',
      'waxing gibbous': '🌔', 'full moon': '🌕', 'waning gibbous': '🌖',
      'last quarter': '🌗', 'waning crescent': '🌘',
    };
    const moonIcon = moonIcons[moonPhase] || '🌙';

    return `
      <div class="sun-moon-bar">
        <div class="sm-item"><span class="sm-icon">🌅</span><span>Sunrise</span><span class="sm-val">${sunriseStr}</span></div>
        <div class="sm-item"><span class="sm-icon">🌇</span><span>Sunset</span><span class="sm-val">${sunsetStr}</span></div>
        <div class="sm-item"><span class="sm-icon">☀️</span><span>Daylight</span><span class="sm-val">${daylightStr}</span></div>
        <div class="sm-item"><span class="sm-icon">${moonIcon}</span><span>Moon</span><span class="sm-val">${moonPhase}</span></div>
      </div>
    `;
  }

  _renderCalendar() {
    const calEntities = this._config.calendar_entities;
    if (!calEntities.length) {
      return '<div class="cal-empty">Add calendar_entities to config to enable</div>';
    }

    const events = [];
    for (const entityId of calEntities) {
      const entity = this._getState(entityId);
      if (entity && entity.state === 'on') {
        const attrs = entity.attributes;
        events.push({
          title: attrs.message || attrs.friendly_name || 'Event',
          start: attrs.start_time,
          calendar: entityId.replace('calendar.', '').replace(/_/g, ' '),
        });
      }
    }

    if (events.length === 0) {
      return '<div class="cal-empty">No events today</div>';
    }

    const calColors = { work: '#4285f4', family: '#9c27b0', personal: '#1D9E75' };

    return events.map(ev => {
      const startStr = ev.start ? new Date(ev.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
      const calType = ev.calendar.includes('work') ? 'work' : ev.calendar.includes('family') ? 'family' : 'property';
      return `
        <div class="cal-event ${calType}">
          <span class="cal-time">${startStr}</span>
          <span class="cal-title">${ev.title}</span>
          <span class="cal-cal">${ev.calendar}</span>
        </div>
      `;
    }).join('');
  }

  _renderHouseholdAlerts() {
    const alerts = [];

    const packagesEntity = this._config.packages_entity;
    if (packagesEntity) {
      const pkgState = this._stateValue(packagesEntity, '0');
      if (pkgState !== '0' && pkgState !== 'unknown') {
        alerts.push({ icon: '📦', text: `<strong>${pkgState} package${pkgState !== '1' ? 's' : ''}</strong> arriving today`, meta: 'USPS' });
      }
    }

    const wasteEntity = this._config.waste_entity;
    if (wasteEntity) {
      const wasteState = this._getState(wasteEntity);
      if (wasteState && wasteState.state !== 'unknown' && wasteState.state !== 'unavailable') {
        alerts.push({ icon: '🗑️', text: `<strong>${wasteState.attributes?.friendly_name || 'Pickup'}</strong> — ${wasteState.state}`, meta: '' });
      }
    }

    const forecast = this._forecast;
    if (forecast && forecast.length > 0) {
      const next12h = forecast.slice(0, 12);
      const stormHour = next12h.find(f => f.condition === 'lightning-rainy' || (f.precipitation_probability && f.precipitation_probability >= 60));
      if (stormHour) {
        const stormTime = new Date(stormHour.datetime).toLocaleTimeString('en-US', { hour: 'numeric' });
        alerts.push({ icon: '⛈️', text: `<strong>Storm advisory</strong> around ${stormTime} (${stormHour.precipitation_probability}% chance)`, meta: 'NWS' });
      }
    }

    if (alerts.length === 0) {
      alerts.push({ icon: '✅', text: 'No alerts — all clear', meta: '' });
    }

    return alerts.map(a => `
      <div class="ha-alert">
        <span class="ha-icon">${a.icon}</span>
        <span class="ha-text">${a.text}</span>
        ${a.meta ? `<span class="ha-meta">${a.meta}</span>` : ''}
      </div>
    `).join('');
  }

  _renderAirQuality() {
    const aqiEntity = this._config.aqi_entity;
    const aqiState = this._getState(aqiEntity);
    if (!aqiState) {
      return '<span class="aqi-unavailable">AQI data unavailable — enable airnow integration</span>';
    }

    const aqi = parseInt(aqiState.state);
    let aqiClass = 'aqi-good';
    let aqiLabel = 'Good';
    if (aqi > 100) { aqiClass = 'aqi-unhealthy'; aqiLabel = 'Unhealthy'; }
    else if (aqi > 50) { aqiClass = 'aqi-moderate'; aqiLabel = 'Moderate'; }

    const pollenEntity = this._config.pollen_entity;
    const pollenState = pollenEntity ? this._stateValue(pollenEntity, '') : '';

    return `
      <span style="font-size:13px; font-weight:600; color:#fff;">🌬️ Air Quality</span>
      <div class="aqi-badge ${aqiClass}">AQI ${aqi} · ${aqiLabel}</div>
      ${pollenState ? `<span style="font-size:11px; color:#888;">Pollen: ${pollenState}</span>` : ''}
    `;
  }

  _renderNeedsAttention() {
    const items = [];

    const doorEntities = this._config.door_entities;
    let allDoorsClosed = true;
    for (const entityId of doorEntities) {
      const state = this._getState(entityId);
      if (state && state.state === 'on') {
        allDoorsClosed = false;
        items.push({ color: 'red', text: `${state.attributes?.friendly_name || entityId} is <strong>open</strong>` });
      }
    }
    if (allDoorsClosed && doorEntities.length > 0) {
      items.push({ color: 'green', text: 'All doors closed' });
    }

    if (items.length === 0) {
      items.push({ color: 'green', text: 'Nothing needs attention right now' });
    }

    return items.map(item => `
      <li><span class="dot dot-${item.color}"></span><span>${item.text}</span></li>
    `).join('');
  }

  _renderQuickStats() {
    const weather = this._getState(this._config.weather_entity);
    const temp = weather?.attributes?.temperature || '--';

    const personEntities = this._config.person_entities;
    const homeCount = personEntities.filter(id => this._stateValue(id) === 'home').length;

    const doorEntities = this._config.door_entities;
    const allClosed = doorEntities.every(id => this._stateValue(id) !== 'on');

    return `
      <div class="stat-card">
        <div class="value">${temp}<span class="unit">°F</span></div>
        <div class="label">Temperature</div>
      </div>
      <div class="stat-card">
        <div class="value" ${allClosed ? 'style="color:#1D9E75"' : 'style="color:#e74c3c"'}>${allClosed ? 'All' : 'Open!'}</div>
        <div class="label">Doors Closed</div>
      </div>
      <div class="stat-card">
        <div class="value">${homeCount}</div>
        <div class="label">People Home</div>
      </div>
    `;
  }

  _renderSystems() {
    const systemEntities = this._config.system_entities;
    if (systemEntities.length === 0) {
      return '<div class="sys-pill"><span class="sys-dot up"></span> No system monitors configured</div>';
    }

    return systemEntities.map(entityId => {
      const state = this._getState(entityId);
      const name = state?.attributes?.friendly_name || entityId.replace('binary_sensor.', '').replace(/_/g, ' ');
      const isUp = state?.state === 'on' || state?.state === 'home' || state?.state === 'alive';
      return `<div class="sys-pill"><span class="sys-dot ${isUp ? 'up' : 'down'}"></span> ${name}</div>`;
    }).join('');
  }

  _renderEnergy() {
    const energyEntities = this._config.energy_entities;
    if (energyEntities.length === 0) {
      return '<p style="font-size:12px;color:#666;font-style:italic;">Add energy_entities to config to enable</p>';
    }

    return energyEntities.map(entityId => {
      const state = this._getState(entityId);
      const name = state?.attributes?.friendly_name || entityId;
      const val = state?.state || '--';
      const unit = state?.attributes?.unit_of_measurement || '';
      return `
        <div class="energy-row">
          <span class="energy-name">${name}</span>
          <span class="energy-val">${val} ${unit}</span>
        </div>
      `;
    }).join('');
  }

  _renderCameras() {
    const cameraEntities = this._config.camera_entities;
    if (cameraEntities.length === 0) {
      return '<p style="font-size:12px;color:#666;font-style:italic;">Add camera_entities to config to enable</p>';
    }

    return cameraEntities.map(entityId => {
      const state = this._getState(entityId);
      const name = state?.attributes?.friendly_name || entityId.replace('camera.', '').replace(/_/g, ' ');
      const entityPicture = state?.attributes?.entity_picture;
      const imgSrc = entityPicture ? entityPicture : '';
      return `
        <div class="camera-card">
          <div class="camera-feed" ${imgSrc ? `style="background-image:url('${imgSrc}');background-size:cover;background-position:center;"` : ''}>
            ${!imgSrc ? `<span>${name}</span>` : ''}
          </div>
          <div class="camera-label">${name}</div>
        </div>
      `;
    }).join('');
  }

  _render() {
    if (!this._hass) return;

    const weather = this._getState(this._config.weather_entity);
    const temp = weather?.attributes?.temperature || '--';
    const humidity = weather?.attributes?.humidity || '--';
    const windSpeed = weather?.attributes?.wind_speed || '--';
    const weatherState = weather?.state?.replace(/_/g, ' ') || '--';
    const weatherIcon = this._getWeatherIcon(weather?.state);
    const highTemp = this._forecast?.[0]?.temperature || '--';

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <div class="card">
        <!-- Header -->
        <div class="header">
          <div class="header-left">
            <div>
              <h1>${weatherIcon} ${this._getGreeting()}</h1>
              <span class="header-sub">${this._formatDate()}</span>
            </div>
          </div>
          <div class="header-right">
            <span class="badge badge-green">ALL OK</span>
          </div>
        </div>

        <!-- AI Briefing -->
        ${this._config.show_briefing ? `
        <div class="section briefing-section">
          <div class="section-header">
            <h2><span class="ai-sparkle">✦</span> AI Briefing</h2>
            <span class="briefing-update-time"></span>
          </div>
          <div class="briefing-content">
            <p class="briefing-placeholder">AI briefing will appear here once configured</p>
          </div>
        </div>
        ` : ''}

        <!-- Weather Banner -->
        <div class="weather-banner">
          <span class="wb-icon">${weatherIcon}</span>
          <div class="wb-text">
            <strong>${temp}°F</strong> → High ${highTemp}°F · ${weatherState} · ${humidity}% humidity · Wind ${windSpeed} mph
          </div>
        </div>

        <!-- Hourly Forecast -->
        ${this._config.show_forecast ? `
        <div class="forecast-row">
          ${this._renderForecast()}
        </div>
        ` : ''}

        <!-- Sun / Moon -->
        ${this._config.show_sun_moon ? `
        <div class="section section-compact">
          ${this._renderSunMoon()}
        </div>
        ` : ''}

        <!-- Calendar -->
        ${this._config.show_calendar ? `
        <div class="section">
          <div class="section-header">
            <h2>📅 Today's Schedule</h2>
          </div>
          <div class="calendar-strip">
            ${this._renderCalendar()}
          </div>
        </div>
        ` : ''}

        <!-- Household Alerts -->
        ${this._config.show_household_alerts ? `
        <div class="section">
          <div class="section-header">
            <h2>🏠 Household Alerts</h2>
          </div>
          <div class="household-alerts">
            ${this._renderHouseholdAlerts()}
          </div>
        </div>
        ` : ''}

        <!-- Air Quality -->
        ${this._config.show_air_quality ? `
        <div class="section section-compact">
          <div class="aqi-bar">
            ${this._renderAirQuality()}
          </div>
        </div>
        ` : ''}

        <!-- Needs Attention -->
        ${this._config.show_needs_attention ? `
        <div class="section">
          <div class="section-header">
            <h2>⚡ Needs Attention</h2>
          </div>
          <ul class="attention-list">
            ${this._renderNeedsAttention()}
          </ul>
        </div>
        ` : ''}

        <!-- Quick Stats -->
        ${this._config.show_quick_stats ? `
        <div class="section">
          <div class="section-header">
            <h2>📊 At a Glance</h2>
          </div>
          <div class="quick-stats">
            ${this._renderQuickStats()}
          </div>
        </div>
        ` : ''}

        <!-- Systems Health -->
        ${this._config.show_systems ? `
        <div class="section">
          <div class="section-header">
            <h2>🖥️ Systems</h2>
          </div>
          <div class="systems-row">
            ${this._renderSystems()}
          </div>
        </div>
        ` : ''}

        <!-- Energy + Cameras side by side -->
        <div class="grid-2">
          ${this._config.show_energy ? `
          <div class="section">
            <div class="section-header">
              <h2>🔋 Energy Today</h2>
            </div>
            ${this._renderEnergy()}
          </div>
          ` : ''}
          ${this._config.show_cameras ? `
          <div class="section">
            <div class="section-header">
              <h2>📷 Cameras</h2>
            </div>
            <div class="camera-grid">
              ${this._renderCameras()}
            </div>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <span class="version">Home Overview v${HOME_CARD_VERSION}</span>
        </div>
      </div>
    `;

    if (this._config.show_briefing) {
      this._renderBriefingSection();
    }
  }

  _styles() {
    return `
      :host { display: block; }
      .card {
        background: #0f0f1a;
        border-radius: 16px;
        padding: 24px;
        color: #e0e0e0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      /* Header */
      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      .header h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: #fff;
      }
      .header-sub {
        font-size: 12px;
        color: #888;
      }
      .badge { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 4px; letter-spacing: 0.5px; }
      .badge-green { background: #1D9E75; color: #fff; }

      /* Sections */
      .section {
        background: #1a1a2e;
        border-radius: 14px;
        padding: 20px;
        margin-bottom: 16px;
      }
      .section-compact { padding: 14px 20px; }
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }
      .section-header h2 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
      }

      /* AI Briefing */
      .briefing-section {
        border: 1px solid rgba(147,51,234,0.3);
        background: linear-gradient(135deg, #1a1a2e 0%, #1e1533 100%);
      }
      .ai-sparkle {
        background: linear-gradient(135deg, #9333ea, #6366f1);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 16px;
      }
      .briefing-text {
        font-size: 13px;
        line-height: 1.8;
        color: #d0d0e0;
        margin: 0;
      }
      .briefing-meta {
        margin-top: 10px;
        display: flex;
        gap: 12px;
        align-items: center;
      }
      .briefing-source, .briefing-time {
        font-size: 10px;
        color: #555;
        background: #16213e;
        padding: 4px 8px;
        border-radius: 4px;
      }
      .briefing-placeholder {
        font-size: 12px;
        color: #666;
        font-style: italic;
        margin: 0;
      }
      .briefing-update-time {
        font-size: 10px;
        color: #666;
      }

      /* Weather Banner */
      .weather-banner {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        border-radius: 12px;
        margin-bottom: 16px;
        background: linear-gradient(135deg, #1D9E75 0%, #16a085 100%);
        color: #fff;
      }
      .wb-icon { font-size: 24px; }
      .wb-text { flex: 1; font-size: 14px; line-height: 1.5; }
      .wb-text strong { font-size: 16px; }

      /* Forecast Row */
      .forecast-row {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding: 4px 0;
        margin-bottom: 16px;
      }
      .forecast-row::-webkit-scrollbar { height: 4px; }
      .forecast-row::-webkit-scrollbar-thumb { background: #2a2a3e; border-radius: 2px; }
      .forecast-hour {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 68px;
        background: #1a1a2e;
        border-radius: 10px;
        padding: 10px 8px;
        gap: 4px;
        flex-shrink: 0;
      }
      .fh-time { font-size: 10px; color: #888; font-weight: 600; }
      .fh-icon { font-size: 18px; }
      .fh-temp { font-size: 13px; font-weight: 700; color: #fff; }
      .fh-rain { font-size: 10px; color: #4fc3f7; min-height: 14px; }
      .forecast-empty { font-size: 12px; color: #666; font-style: italic; padding: 10px; }

      /* Sun Moon */
      .sun-moon-bar {
        display: flex;
        gap: 16px;
        align-items: center;
        flex-wrap: wrap;
        font-size: 12px;
        color: #aaa;
      }
      .sm-item { display: flex; align-items: center; gap: 6px; }
      .sm-icon { font-size: 16px; }
      .sm-val { font-weight: 600; color: #fff; }

      /* Calendar */
      .calendar-strip { display: flex; flex-direction: column; gap: 6px; }
      .cal-event {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        background: #16213e;
        border-radius: 8px;
        border-left: 3px solid #1D9E75;
      }
      .cal-event.work { border-left-color: #4285f4; }
      .cal-event.family { border-left-color: #9c27b0; }
      .cal-event.property { border-left-color: #1D9E75; }
      .cal-time { font-size: 11px; font-weight: 700; color: #888; min-width: 60px; font-family: monospace; }
      .cal-title { font-size: 13px; font-weight: 600; color: #fff; flex: 1; }
      .cal-cal { font-size: 10px; color: #666; }
      .cal-empty { font-size: 12px; color: #666; font-style: italic; }

      /* Household Alerts */
      .household-alerts { display: flex; flex-direction: column; gap: 6px; }
      .ha-alert {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        background: #16213e;
        border-radius: 8px;
        font-size: 12px;
      }
      .ha-icon { font-size: 16px; width: 24px; text-align: center; }
      .ha-text { flex: 1; color: #e0e0e0; }
      .ha-meta { font-size: 10px; color: #666; }

      /* AQI */
      .aqi-bar { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
      .aqi-badge {
        display: flex; align-items: center; gap: 6px;
        padding: 6px 12px; border-radius: 6px;
        font-size: 12px; font-weight: 600;
      }
      .aqi-good { background: rgba(29,158,117,0.15); color: #1D9E75; }
      .aqi-moderate { background: rgba(212,160,23,0.15); color: #d4a017; }
      .aqi-unhealthy { background: rgba(231,76,60,0.15); color: #e74c3c; }
      .aqi-unavailable { font-size: 12px; color: #666; font-style: italic; }

      /* Needs Attention */
      .attention-list { list-style: none; padding: 0; margin: 0; }
      .attention-list li {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid #2a2a3e;
        font-size: 13px;
      }
      .attention-list li:last-child { border-bottom: none; }
      .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
      .dot-green { background: #1D9E75; }
      .dot-yellow { background: #d4a017; }
      .dot-red { background: #e74c3c; }

      /* Quick Stats */
      .quick-stats { display: flex; gap: 16px; flex-wrap: wrap; }
      .stat-card {
        flex: 1;
        min-width: 100px;
        background: #16213e;
        border-radius: 10px;
        padding: 16px;
        text-align: center;
      }
      .stat-card .value { font-size: 24px; font-weight: 700; color: #fff; }
      .stat-card .unit { font-size: 14px; color: #888; font-weight: 400; }
      .stat-card .label {
        font-size: 11px; color: #888; margin-top: 4px;
        text-transform: uppercase; letter-spacing: 0.5px;
      }

      /* Systems */
      .systems-row { display: flex; gap: 10px; flex-wrap: wrap; }
      .sys-pill {
        display: flex; align-items: center; gap: 6px;
        padding: 6px 12px; background: #16213e;
        border-radius: 20px; font-size: 11px; font-weight: 600; color: #e0e0e0;
      }
      .sys-dot { width: 8px; height: 8px; border-radius: 50%; }
      .sys-dot.up { background: #1D9E75; }
      .sys-dot.down { background: #e74c3c; animation: pulse-dot 2s infinite; }
      @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:0.4} }

      /* Energy */
      .energy-row {
        display: flex; justify-content: space-between;
        font-size: 13px; padding: 4px 0;
      }
      .energy-val { font-weight: 600; color: #4285f4; }

      /* Cameras */
      .camera-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .camera-card { background: #16213e; border-radius: 8px; overflow: hidden; }
      .camera-feed {
        width: 100%; height: 70px; background: #0a0a15;
        display: flex; align-items: center; justify-content: center;
        color: #555; font-size: 11px;
      }
      .camera-label { padding: 6px 10px; font-size: 11px; font-weight: 600; color: #ccc; }

      /* Grid */
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      @media (max-width: 700px) { .grid-2 { grid-template-columns: 1fr; } }

      /* Footer */
      .footer { text-align: center; margin-top: 12px; }
      .version { font-size: 10px; color: #444; }
    `;
  }

  getCardSize() {
    return 12;
  }

  static getConfigElement() {
    return document.createElement('home-overview-card-editor');
  }

  static getStubConfig() {
    return {
      daystrom_url: 'http://192.168.1.218:8090',
      weather_entity: 'weather.home',
      calendar_entities: [],
      person_entities: [],
      camera_entities: [],
      system_entities: [],
      door_entities: [],
      energy_entities: [],
    };
  }
}

customElements.define('home-overview-card', HomeOverviewCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'home-overview-card',
  name: 'Home Overview',
  description: 'Personalized morning dashboard with weather, calendar, AI briefing, and system status',
  preview: true,
});

console.info(`%c HOME-OVERVIEW %c v${HOME_CARD_VERSION} `, 'background:#9333ea;color:#fff;font-weight:700;', 'background:#1a1a2e;color:#9333ea;');
