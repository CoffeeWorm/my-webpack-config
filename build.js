const program = require('commander');

program
  .version('0.0.1')
  .option('-e, --env [name]', 'Build environment')
  .option('-a, --analysis', 'Open analysis')
  .parse(process.argv);

const { name, analysis } = program;
process.env.NODE_ENV = name;
process.analysis = analysis;
process.env.devMode = name !== 'production';

const webpack = require('webpack');
const config = require('./webpack.config');
const ora = require('ora');
const chalk = require('chalk');
const spinner = ora(`Building for ${process.env.NODE_ENV}...`);

spinner.start();
webpack(config, (err, stats) => {
  spinner.stop();
  if (err) throw err;
  process.stdout.write(
    stats.toString({
      colors: true,
      modules: false,
      chunks: false,
      chunkModules: false,
      warningsFilter: warning => /Conflicting order between/gm.test(warning),
      children: false
    }) + '\n\n'
  );
  if (stats.hasErrors()) {
    console.log(chalk.red('Build failed with errors.\n'));
    process.exit(1);
  }

  console.log(chalk.green('Build complete.\n'));
  console.log(
    chalk.yellow(
      'Tip: Built files are meant to be served over an HTTP server.\n' +
        "Opening index.html over file:// won't work.\n"
    )
  );
});
