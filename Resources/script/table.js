/**
 * User: hammer
 * Date: 13-7-4
 * Time: 下午5:45
 */

var utils = loadModule("util.js");

var gameTables = {};

function loadTableFile(table){
    var filename = table+".jsc";

    if( !file.exist(filename) )
    {
        filename = table+".js";
    }

    try{
        var tab = loadModule(filename);
        return tab.data;
    }
    catch(e){
        error("failed to load table("+filename+") with Exception:\n"+ e);
        return null;
    }
}

function loadTable(table)
{
    debug("load("+table+")");

    if( gameTables[table] != undefined )
    {
        delete gameTables[table];
    }
    var data = loadTableFile(table);
    if( data != null ){
        gameTables[table] = data;
    }
}

function queryTable(dicname, index, abseed)
{
    if( gameTables[dicname] != undefined )
    {
        var item = gameTables[dicname][index];
        if( item != null && item.abtest != null ){
            var seed = engine.session.ABTestSeed;
            if( abseed != null ) seed = abseed;
            var index = Math.floor(seed%item.abtest.length);
            return item.abtest[index];
        }
        else{
            return item;
        }
    }
    return null;
}

function getTableLength(dicname)
{
    if( gameTables[dicname] != undefined )
    {
        return gameTables[dicname].length;
    }
    return null;
}

function readTable(dicname)
{
    if( gameTables[dicname] != undefined )
    {
        return gameTables[dicname];
    }
    return null;
}

function unloadTable(dicname)
{
    if( gameTables[dicname] != undefined )
    {
        delete gameTables[dicname];
    }
}

function unloadAllTables()
{
    gameTables = {};
}

exports.loadTableFile = loadTableFile;
exports.loadTable = loadTable;
exports.queryTable = queryTable;
exports.readTable = readTable;
exports.getTableLength = getTableLength;
exports.unloadTable = unloadTable;
exports.unloadAllTables = unloadAllTables;