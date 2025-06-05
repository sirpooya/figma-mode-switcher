# Theme Mode Switcher for Figma

A Figma plugin that allows you to quickly switch between variable collection modes with a clean, intuitive interface. Perfect for design systems that use multiple themes (light/dark, brand variants, etc.).

## Features

- 🎨 **Quick Theme Switching** - Switch between variable modes with a single click
- 🔍 **Search & Filter** - Find themes quickly with the built-in search functionality
- 🎯 **Smart Targeting** - Apply modes to selected elements or entire pages
- 🔄 **Reset Function** - Reset variable modes to their default state
- 🌈 **Visual Indicators** - Color-coded theme previews for easy identification
- ⚡ **Library Support** - Works with both local and team library variable collections

## Installation

### From Figma Community (Recommended)
1. Visit the [Figma Community page](#) (link coming soon)
2. Click "Install" to add it to your plugins
3. Access it from Plugins → Theme Mode Switcher

### Manual Installation (Developers)
1. Clone this repository
2. Open Figma Desktop
3. Go to Plugins → Development → Import plugin from manifest
4. Select the `manifest.json` file from this project

## How to Use

### Basic Usage
1. Open the plugin from the Plugins menu
2. Select a theme from the dropdown list
3. Click "Apply" to switch themes

### Advanced Features

#### Targeted Application
- **Page-wide**: With nothing selected, the theme applies to the entire page
- **Element-specific**: Select specific elements to apply themes only to those elements

#### Search & Filter
- Click on the dropdown to activate search mode
- Type to filter available themes
- Use arrow keys to navigate, Enter to select

#### Reset Themes
- Click "Reset" to return variable modes to their default state
- Works on both selected elements and entire pages

## Theme Configuration

The plugin automatically detects your variable collections. For optimal experience:

1. **Naming Convention**: Use descriptive names for your variable collection modes
2. **Color Coding**: The plugin displays colored circles next to each theme name for quick visual identification
3. **Library Collections**: Works seamlessly with published team library collections

### Supported Collections
The plugin is designed to work with cascading theme collections:
- 🌈 Theme (base collection)
- 🌈 Theme 2 (extends Theme)
- 🌈 Theme 3 (extends Theme 2)
- 🌈 Theme 4 (extends Theme 3)

## Customization

### Theme Colors
You can customize the color indicators by modifying the `logoConfigData` object in `ui.html`:

```javascript
var logoConfigData = {
  "Light": "#FFFFFF",
  "Dark": "#000000",
  "Brand": "#0066CC",
  // Add your theme colors here
};
```

### Theme Names
The plugin automatically detects all available variable collection modes. Simply rename your modes in Figma's variable panel.

## Development

### File Structure
```
theme-mode-switcher/
├── manifest.json      # Plugin manifest
├── code.js           # Main plugin logic
├── ui.html           # Plugin interface
└── README.md         # This file
```

### Building
No build process required. This plugin uses vanilla JavaScript and HTML.

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## API Limitations

**Note**: Due to Figma API limitations, the "Reset" function cannot completely remove variable mode assignments. Instead, it resets modes to their default (first) state. This is a known limitation acknowledged by Figma's engineering team.

## Compatibility

- **Figma Version**: Works with all recent versions of Figma
- **Collections**: Supports both local and team library variable collections
- **Modes**: Compatible with all variable collection modes
- **Browsers**: Chrome, Firefox, Safari, Edge (Figma Desktop recommended)

## Troubleshooting

### Common Issues

**Themes not appearing in dropdown**
- Ensure you have variable collections with multiple modes
- Check that collections are properly published (for team libraries)
- Refresh the plugin if collections were recently modified

**Reset not working as expected**
- This is expected behavior due to Figma API limitations
- Reset sets modes to default rather than removing assignments completely

**Plugin not loading**
- Check browser console for errors
- Ensure manifest.json is properly formatted
- Try refreshing Figma and reopening the plugin

### Getting Help
- Check the [Issues](../../issues) page for known problems
- Create a new issue with detailed steps to reproduce
- Include your Figma version and browser information

## License

This project is licensed under the GNU General Public License v3.0 (GPLv3) - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ You can use, modify, and distribute this software
- ✅ You can use it for commercial purposes
- ⚠️ You must include the license and copyright notice
- ⚠️ Any modifications must also be open-sourced under GPLv3

## Credits

**Author**: Pooya Kamel  
**License**: GPLv3  
**Version**: 1.0.0

## Changelog

### v1.0.0 (Initial Release)
- Theme switching functionality
- Search and filter capabilities
- Reset to default functionality
- Color-coded theme indicators
- Support for library collections
- Cascading theme mode support

---

**Made with ❤️ for the Figma design community**

*If this plugin helps your workflow, consider starring the repository and sharing it with other designers!*