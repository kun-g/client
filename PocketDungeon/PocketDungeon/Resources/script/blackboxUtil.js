/**
 * User: hammer
 * Date: 13-9-13
 * Time: 上午11:11
 */

console = {};
serverTables = {};

console.log = function()
{
    var output = "[blackbox] ";
    for(var k in arguments){
        output += arguments[k];
    }
    debug(output);
}

requires = function(path)
{
    var ls = path.lastIndexOf("/");
    if( ls>=0 )
    {
        var file = path.substr(ls+1);//escape the last slash
    }
    else
    {
        var file = path;
    }
    file += ".js";//append extension
    return loadModule(file);
}

readTable = function(table)
{
    var tab = loadModule("table.js");
    return tab.readTable(table);
}

overrideTable = function(table, data)
{
    serverTables[table] = data;
}

queryTable = function(table, index, abIndex)
{
    //debug("* queryTable("+table+", "+index+")");
    if( serverTables[table] == null )
    {
        var tab = loadModule("table.js");
        return tab.queryTable(table, index, abIndex);
    }
    else
    {
        var tb = serverTables[table][index];
        if (tb && tb.abtest) {
            if (abIndex) {
                return tb.abtest[abIndex%tb.abtest.length];
            } else {
                return tb.abtest[0];
            }
        } else {
            return tb;
        }
    }
}