export interface Config {
  renderHtml: boolean;
}

const config: Config = {
  renderHtml: false,
};

function applyOptions(options: Partial<Config>): void {
  if (options.renderHtml !== undefined) {
    if (typeof options.renderHtml !== 'boolean') {
      throw new Error('renderHtml must be a boolean');
    }
    config.renderHtml = options.renderHtml;
  }
}

export { config, applyOptions };
