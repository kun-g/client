/**
 * User: hammer
 * Date: 13-7-4
 * Time: 下午5:45
 */

var utils = loadModule("util.js");

var key = "WhyDoingThis";
var gameTables = {};

function loadTableFile(table){
    var filename = table+".bad";
    var encrypted = true;

    if( !file.exist(filename) )
    {
        filename = table+".json";
        encrypted = false;
    }

    var data = null;
    if( encrypted )
    {
        data = file.decrypt(key, filename);
    }
    else
    {
        data = file.read(filename);
    }
    return data;
}

function loadTable(table)
{
    debug("load("+table+")");

    if( gameTables[table] != undefined )
    {
        delete gameTables[table];
    }
    var data = loadTableFile(table);
    try
    {
        var dicobj = JSON.parse(data);
        gameTables[table] = dicobj;
    }
    catch(e){
        gameTables[table] = null;
        error("failed to load table("+table+") with Exception:\n"+ e);
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