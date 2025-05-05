# Golf Game Scorecards

A collection of interactive golf game scorecards for various formats including Stableford, Bloodsome, Vegas, and Bingo Bango Bongo.

## Features

- Interactive scorecards for multiple golf game formats
- Real-time score calculation and settlement
- Support for up to 4 players
- Responsive design for mobile and desktop
- Modern UI with Tailwind CSS

## Game Formats

### Stableford
- Points awarded based on performance relative to par
- Two scoring systems:
  - Standard: 0 for double bogey or worse, 1 for bogey, 2 for par, 3 for birdie, 4 for eagle
  - Modified: -1 for double bogey, 0 for bogey, 1 for par, 2 for birdie, 3 for eagle
- Configurable point value for settlement

### Bloodsome
- Match play format with points awarded for winning holes
- Additional points for birdies and eagles
- Configurable point values for different achievements

### Vegas
- Team-based format with combined scores
- Points awarded based on team performance
- Support for different team configurations

### Bingo Bango Bongo
- Three points available per hole:
  - First to reach the green
  - Closest to the pin
  - First to hole out
- Configurable point values for each achievement

## Directory Structure

```
dist/
├── css/
│   └── styles.css
├── js/
│   ├── stableford.js
│   ├── bloodsome.js
│   ├── vegas.js
│   └── bingo-bango-bongo.js
├── stableford.html
├── bloodsome.html
├── vegas.html
└── bingo-bango-bongo.html
```

## Setup

1. Clone the repository
2. Open any of the HTML files in a modern web browser
3. No build process required - the application runs directly in the browser

## Dependencies

- Tailwind CSS (loaded via CDN)
- Modern web browser with JavaScript ES6 support

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License 