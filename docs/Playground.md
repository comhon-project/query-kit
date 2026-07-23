# Playground

A fully functional playground is included with this library, allowing you to explore and experiment with all available features.

## Try it online

The playground is deployed and ready to use, no setup required:

[**Open the live playground →**](https://comhon-project.github.io/query-kit/playground/ ':target=_blank')

## Run it locally

### Prerequisites

- Node.js installed on your machine
- npm package manager

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:comhon-project/query-kit.git
   ```

2. Navigate to the Vue package directory:
   ```bash
   cd query-kit/packages/vue
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to the URL displayed in your terminal.

The playground demonstrates a complete `QkitSearch` setup with:
- Multiple entity schemas (user, organization, car, office)
- Enum schemas with translations
- Locale switching (11 languages)
- Custom input components
- Custom cell renderers
- Computed scopes
- Mock requester with simulated data
