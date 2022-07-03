#!/usr/bin/env node
module.exports = core;

const path = require("path");
const pkg = require("../package.json");
const log = require("@qinshihuang/log");
const constants = require("./const");
const semver = require("semver");
const colors = require("colors/safe");
const userHome = require("user-home");
const pathExists = require("path-exists").sync;
let args;
function core() {
  try {
    checkPkgVersion();
    checkNodeVersion();
    checkRoot();
    checkUserHome();
    checkInputArgs();
    checkEnv();
    checkGlobalUpdate();
    log.verbose("cli", "debug 模式");
  } catch (e) {
    console.error(e.message);
  }
}

async function checkGlobalUpdate() {
  const currentVersion = pkg.version;
  const npmName = pkg.name;
  const { getNpmSemverVersion } = require("@qinshihuang/get-npm-info");
  const lastVersion = await getNpmSemverVersion(currentVersion, npmName);
  if (lastVersion && semver.gt(lastVersion, currentVersion)) {
    log.warn(
      colors.yellow(`请手动更新 ${npmName}，当前版本：${currentVersion}，最新版本：${lastVersion}
                更新命令： npm install -g ${npmName}`)
    );
  }
}

function checkEnv() {
  const dotenv = require("dotenv");
  const dotenvPath = path.resolve(userHome, ".env");
  if (pathExists(dotenvPath)) {
    dotenv.config({
      path: dotenvPath,
    });
  }
  createDefaultConfig();
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHome,
  };
  if (process.env.CLI_HOME) {
    cliConfig["cliHome"] = path.join(userHome, process.env.CLI_HOME);
  } else {
    cliConfig["cliHome"] = path.join(userHome, constants.DEFAULT_CLI_HOME);
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome;
  console.log(process.env.CLI_HOME_PATH);
}

function checkArgs() {
  if (args.debug) {
    log.level = "verbose";
  } else {
    log.level = "info";
  }
}

function checkInputArgs() {
  const minimist = require("minimist");
  args = minimist(process.argv.slice(2));
  checkArgs();
}

function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(
      colors.red(`当前用户主目录不存在，请检查 ${userHome} 是否存在`)
    );
  }
}

function checkRoot() {
  const rootCheck = require("root-check");
  rootCheck();
  // console.log(process.geteuid());
}

function checkNodeVersion() {
  const lowestVersion = constants.LOWEST_NODE_VERSION;
  const currentNodeVersion = process.version;
  if (!semver.gte(currentNodeVersion, lowestVersion)) {
    throw new Error(
      colors.red(
        `当前 Node 版本 ${currentNodeVersion} 不支持，请升级至 ${lowestVersion} 以上版本`
      )
    );
  }
}

function checkPkgVersion() {
  log.notice("cli", pkg.version);
}
