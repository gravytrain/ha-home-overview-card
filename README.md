# Home Overview Card

A personalized morning dashboard card for Home Assistant. Shows weather, hourly forecast, calendar, AI briefing, air quality, household alerts, system status, and more.

## Installation

1. Add this repository as a custom repository in HACS (category: Lovelace)
2. Install "Home Overview Card"
3. Add to your dashboard:

```yaml
type: custom:home-overview-card
daystrom_url: http://192.168.1.218:8090
weather_entity: weather.home
calendar_entities:
  - calendar.work
  - calendar.family
person_entities:
  - person.michael
door_entities:
  - binary_sensor.pumphouse_door
camera_entities:
  - camera.front_yard
  - camera.back_yard
system_entities:
  - binary_sensor.internet_ping
  - binary_sensor.daystrom_ping
energy_entities:
  - sensor.north_daily_energy
  - sensor.south_daily_energy
aqi_entity: sensor.airnow_aqi
```

## Features

- Personalized greeting based on HA user and time of day
- AI morning briefing (via Daystrom API)
- Current weather + 8-hour forecast with rain probability
- Sun/moon data (sunrise, sunset, daylight remaining, moon phase)
- Calendar integration (color-coded by calendar type)
- Household alerts (packages, waste collection, weather advisories)
- Air quality index + pollen
- Needs attention list (open doors, overdue tasks)
- Quick stats (temperature, doors, people home)
- System health monitoring (ping sensors)
- Energy usage summary
- Camera thumbnails

## Configuration

| Key | Default | Description |
|-----|---------|-------------|
| `daystrom_url` | `http://192.168.1.218:8090` | Daystrom API endpoint |
| `weather_entity` | `weather.home` | Weather integration entity |
| `calendar_entities` | `[]` | List of calendar entity IDs |
| `person_entities` | `[]` | List of person entity IDs |
| `door_entities` | `[]` | List of binary sensor door entities |
| `camera_entities` | `[]` | List of camera entity IDs |
| `system_entities` | `[]` | List of binary sensor ping/uptime entities |
| `energy_entities` | `[]` | List of energy sensor entities |
| `aqi_entity` | `sensor.airnow_aqi` | Air quality sensor |
| `pollen_entity` | `` | Pollen/allergy sensor (IQVIA) |
| `sun_entity` | `sun.sun` | Sun integration entity |
| `moon_entity` | `sensor.moon_phase` | Moon phase sensor |
| `packages_entity` | `` | USPS mail & packages sensor |
| `waste_entity` | `` | Waste collection sensor |

### Show/Hide Sections

| Key | Default | Description |
|-----|---------|-------------|
| `show_briefing` | `true` | AI morning briefing |
| `show_forecast` | `true` | Hourly forecast row |
| `show_calendar` | `true` | Calendar events |
| `show_sun_moon` | `true` | Sun/moon data |
| `show_air_quality` | `true` | AQI display |
| `show_household_alerts` | `true` | Package/waste/weather alerts |
| `show_needs_attention` | `true` | Attention items |
| `show_quick_stats` | `true` | Quick stat cards |
| `show_systems` | `true` | System health pills |
| `show_energy` | `true` | Energy summary |
| `show_cameras` | `true` | Camera thumbnails |

## Data Sources

Each section gracefully degrades — if the integration isn't set up or the entity doesn't exist, the section shows a helpful placeholder instead of breaking.

| Section | Required HA Integration |
|---------|------------------------|
| Weather + Forecast | NWS or OpenWeatherMap |
| Sun/Moon | Sun (built-in) + Moon |
| Calendar | Google Calendar or CalDAV |
| AQI | AirNow |
| Pollen | IQVIA (HACS) |
| Packages | Mail and Packages (HACS) |
| Waste | Waste Collection Schedule (HACS) |
| Systems | Ping or Uptime Kuma |
| AI Briefing | Daystrom + LLM automation |
