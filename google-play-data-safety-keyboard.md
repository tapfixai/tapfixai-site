# Google Play Data Safety Draft — TapFix AI Keyboard

This is a working draft for Google Play Console. Final answers should be checked against the exact production backend, retention settings, analytics/crash reporting setup and legal review before release.

## App Data Collected

### Text and user-generated content

- **Collected:** Yes, when the user triggers AI actions such as Fix, Rewrite, Style or Translate.
- **Purpose:** App functionality.
- **Shared:** May be processed by TapFix AI servers and AI service providers to generate the requested result.
- **Encrypted in transit:** Yes, HTTPS.
- **Required:** Required only for AI features.

### Device or other IDs

- **Collected:** Yes. AI requests may include a device identifier, app package and app version.
- **Purpose:** App functionality, security, abuse prevention and access control.
- **Shared:** Processed by TapFix AI backend infrastructure.
- **Encrypted in transit:** Yes, HTTPS.
- **Required:** Required for AI backend access.

### Audio

- **Voice or sound recordings: Collected:** Yes (since 1.0.58). Only when TapFix AI voice input is used (Google speech recognition does not work on the phone, or the user picks TapFix AI). Audio goes over HTTPS to api.tapfixai.app and is transcribed by OpenAI.
- **Processed ephemerally:** Yes. Audio and text are not stored by TapFix.
- **Shared:** No (OpenAI is a service provider processing on our behalf).
- **Default path:** Android speech recognition (Google) on the device, TapFix receives no audio.
- **Purpose:** App functionality.
- **Required:** Optional; only needed for dictation.

### Photos and videos / images

- **Collected by TapFix AI server:** No, based on current implementation.
- **Accessed on device:** Recent screenshots/images may be read locally to show quick paste and clipboard image options.
- **Purpose:** App functionality.
- **Required:** Optional; only needed for image/screenshot paste features.

### Clipboard text, links and image references

- **Collected by TapFix AI server:** No, based on current implementation unless the user sends clipboard text to an AI action.
- **Stored locally:** Yes, clipboard history is stored on the device for keyboard clipboard features.
- **Purpose:** App functionality.
- **Required:** Optional feature behavior.

### App activity / diagnostics

- **Collected:** Only if production crash reporting or diagnostics are enabled.
- **Purpose:** Analytics, app functionality, crash prevention.
- **Action before release:** Confirm whether crash reporting/analytics is enabled and answer Play Console accordingly.

## Security Practices

- Data is encrypted in transit for backend requests.
- The app does not sell personal data.
- The app lets users control optional permissions through Android settings.
- Local histories remain on device until cleared, changed or app uninstall.

## Permission Summary

- `INTERNET`: AI features and backend access.
- `BIND_INPUT_METHOD`: Android keyboard input method.
- `RECORD_AUDIO`: Dictation.
- `READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE`: Screenshot and image quick paste.
- `VIBRATE`: Haptic feedback.
