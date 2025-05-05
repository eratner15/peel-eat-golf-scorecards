# Peel & Eat Golf Scorecards

A web application for managing golf scorecards with support for various game types including Nassau, Wolf, and Vegas.

## Features

- Multiple game types (Nassau, Wolf, Vegas)
- Real-time score tracking
- Automatic point calculations
- State persistence
- Responsive design
- Performance monitoring
- Error recovery

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/peel-eat-golf-scorecards.git
cd peel-eat-golf-scorecards
```

2. Install dependencies:
```bash
npm install
```

## Development

To start the development server:
```bash
npm start
```

The application will be available at `http://localhost:8080`

## Building for Production

To create a production build:
```bash
npm run build
```

The built files will be in the `dist` directory.

## Testing

To run tests:
```bash
npm test
```

To run linting:
```bash
npm run lint
```

## Deployment

### Netlify Deployment

1. Create a new site in Netlify
2. Connect your GitHub repository
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Deploy!

### Manual Deployment

1. Build the project:
```bash
npm run build
```

2. Upload the contents of the `dist` directory to your web server

## Project Structure

```
peel-eat-golf-scorecards/
├── js/
│   ├── core/
│   │   ├── main.js
│   │   ├── state.js
│   │   ├── ui.js
│   │   ├── utils.js
│   │   ├── validation.js
│   │   ├── performance.js
│   │   └── recovery.js
│   └── games/
│       ├── nassau.js
│       ├── wolf.js
│       └── vegas.js
├── css/
│   └── styles.css
├── assets/
│   └── favicon.ico
├── dist/
├── package.json
├── webpack.config.js
├── netlify.toml
└── README.md
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - see LICENSE file for details 