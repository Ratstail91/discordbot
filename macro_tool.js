let fs = require('fs');

function getAllMacros(user) {
  let text;
  try {
    text = fs.readFileSync("macros/" + user + ".json", "utf8");
  } catch(err) {
    if (err.code === "ENOENT") {
      return null;
    } else {
      throw err;
    }
  }
  return JSON.parse(text);
}

function setAllMacros(user, macros) {
  let text = JSON.stringify(macros);
  fs.writeFileSync("macros/" + user + ".json", text);
}

function macroGet(user, name) {
  let macros = getAllMacros(user);
  if (macros === null) {
    return null;
  } else {
    return macros[name];
  }
}

function macroSet(user, name, command) {
  let macros = getAllMacros(user);
  if (macros === null) {
    macros = {};
  }
  macros[name] = command;
  setAllMacros(user, macros);
}

module.exports = {macroGet, macroSet};
