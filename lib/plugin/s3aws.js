const event = require('../event');
const logger = require('../output');
const recorder = require('../recorder');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const container = require('../container');
const Config = require('../config');

const defaultConfig = {
  outputDir: global.output_dir,
};

let s3;
let AWS;

/**
 * S3 AWS plugin
 *
 * Plugin copies the content of the output directory to S3.
 * If allure-report is enabled, copies allure output too.
 *
 * ##### Usage
 *
 * To start please install `aws-sdk` package
 *
 * ```
 * npm install -g aws-sdk --save-dev
 * ```
 *
 * Add this plugin to config file:
 *
 * ```js
 * "plugins": {
 *     "s3aws": {}
 * }
 * ```
 *
 * Run tests with s3aws plugin enabled:
 *
 * ```
 * codeceptjs run --plugins s3aws
 * ```
 * or
 * ```js
 * "plugins": {
 *     "s3aws": {
 *        "enabled": true
 *    }
  * }
 * ```
 *
 * ##### Configuration
 * * `accessKeyId` - your AWS access key ID.
 * * `secretAccessKey` -  your AWS secret access key.
 * * `endpoint` -  your AWS endpoint.
 * * `bucket` - your bucket on AWS.
 * * `folder` - your root folder to copy.
 *
 */
module.exports = (config) => {
  try {
    AWS = require('aws-sdk');
  } catch (err) {
    throw new Error('Required modules are not installed.\n\nRUN: npm install -g aws-sdk --save-dev');
  }

  config = Object.assign(defaultConfig, config);

  AWS.config.update(config);
  s3 = new AWS.S3({ apiVersion: '2006-03-01' });

  if (!config.accessKeyId) throw new Error('The parameter accessKeyId not defined');
  if (!config.secretAccessKey) throw new Error('The parameter secretAccessKey not defined');
  if (!config.endpoint) throw new Error('The parameter endpoint not defined');
  if (!config.bucket) throw new Error('The parameter bucket not defined');
  if (!config.folder) throw new Error('The parameter folder not defined');

  event.dispatcher.on(event.all.after, () => {
    recorder.add('_afterAllResultHook', () => {
      const s3StaticPath = config.outputDir.replace(process.cwd(), '');
      recurseUpload(config, s3StaticPath);
      const allureReport = container.plugins('allure');
      if (allureReport) {
        const allureOutputDir = Config.get('plugins').allure.outputDir;
        const outputDir = path.join(process.cwd(), allureOutputDir);
        logger.debug(`[S3 AWS Plugin] Try upload allure artifacts from ${outputDir}`);
        recurseUpload({ ...config, outputDir }, allureOutputDir);
      }
    });

    recorder.catch((err) => {
      logger.error(`[S3 AWS Plugin] _afterAllResultHook.${err}`);
      process.exit(1);
    });
  });

  return this;
};

function recurseUpload(config, s3StaticPath) {
  fs.readdir(config.outputDir, { withFileTypes: true }, (err, filesAndDirs) => {
    if (!filesAndDirs.length) {
      logger.debug(`[S3 AWS Plugin] Folder ${config.outputDir} is empty.`);
      return;
    }

    filesAndDirs.forEach((fileOrDir) => {
      if (fileOrDir.isDirectory()) {
        const newStaticPAth = path.join(config.outputDir, fileOrDir.name);
        const newS3StaticPath = `${s3StaticPath}${fileOrDir.name}/`;
        recurseUpload(newStaticPAth, newS3StaticPath);
        return;
      }

      const filePath = path.join(config.outputDir, fileOrDir.name);
      fs.readFile(filePath, (error, Body) => {
        const Key = path.join(`${config.folder}/`, s3StaticPath, fileOrDir.name);
        const uploadParam = {
          Bucket: config.bucket,
          Key,
          Body,
          ContentType: mime.contentType(fileOrDir.name),
        };
        logger.debug(`[S3 AWS Plugin] Start upload to Bucket "${uploadParam.Bucket}" with Key: "${uploadParam.Key}"`);
        s3.upload(uploadParam, (res) => {
          logger.debug(`[S3 AWS Plugin] Upload successfuly: ${filePath} to s3://${path.join(config.bucket, Key)}`);
        });
      });
    });
  });
}
