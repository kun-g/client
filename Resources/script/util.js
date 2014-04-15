/**
 * User: hammer
 * Date: 13-7-4
 * Time: 下午6:26
 */

//remove file extention
function removeFileExt(file)
{
    var pos = file.lastIndexOf(".");
    if( pos > 0 )
    {
        return file.substring(0, pos);
    }
    else
    {
        return file;
    }
}

function initDirectory(path)
{
    if( !file.exist(path) )
    {
        if(file.mkdir(path))
        {
            debug("initDirectory("+path+")");
        }
        else
        {
            error(" failed to initDirectory("+path+")");
        }
    }
}

function applyScheme(target, scheme, source)
{
    for(var shortname in source)
    {
        var fullname = scheme[shortname];
        if( fullname != undefined )
        {
            target[fullname] = source[shortname];
        }
    }
}

function saveScheme(scheme, source)
{
    var ret = {};
    for(var short in scheme)
    {
        var long = scheme[short];
        if( source[long] != null )
        {
            ret[short] = source[long];
        }
    }
    return ret;
}

function dumpObject(obj)
{
    debug("DUMP = "+JSON.stringify(obj));
}

var classRegister = {};

function register(func)
{
    classRegister[func.name] = func;
}

function link(obj)
{
    if( obj != null && typeof(obj) == "object" )
    {
        if( obj._ctor != null && classRegister[obj._ctor] != null )
        {
            obj.__proto__ = classRegister[obj._ctor].prototype;
        }
        for(var k in obj)
        {
            link(obj[k]);
        }
    }
}

function unlink(obj)
{
    if( obj != null && typeof(obj) == "object" )
    {
        var conam = obj.constructor.name;
        if( classRegister[conam] != null )
        {
            obj._ctor = conam;
        }

        for(var k in obj)
        {
            unlink(obj[k]);
        }
    }
}

function save(obj)
{
    //debug("SAVING = \n"+JSON.stringify(obj));
    unlink(obj);
    return JSON.stringify(obj);
}

function load(str)
{
    var obj = JSON.parse(str);
    //debug("LOADING = \n"+JSON.stringify(obj));
    link(obj);
    return obj;
}

//used to print cyclic object
function printElement(key, value, level, list, out){
    //insert space
    for(var i=0; i<level; ++i){
        out += "  ";
    }
    out += key + " = ";
    var type = typeof(value);
    if( type == "function" || type == "object"  ){//composite value
        //check the list
        for(var k in list){
            if( value === list[k] ){
                out += "${"+k+"}\n";
                return;
            }
        }
        //register into list
        var keyName = key;
        var keyNumber = 1;
        var keyFinal = key;
        while(true){
            for(var k in list){
                if( k === keyFinal ){
                    keyNumber++;
                    keyFinal = keyName + keyNumber;
                    continue;
                }
            }
            break;
        }
        list[keyFinal] = value;
        //print object
        for(var k in value){
            printElement(k, value[k], level+1, list, out);
        }
    }
    else{//scale value
        out += JSON.stringify(value)+"\n";
    }
}

function markPrint(obj){
    var list = {};
    var str = "# MARK PRINTER #\n";
    printElement("${ROOT}", obj, 0, list, str);
    debug(str);
}

exports.removeFileExt = removeFileExt;
exports.initDirectory = initDirectory;
exports.applyScheme = applyScheme;
exports.saveScheme = saveScheme;
exports.dumpObject = dumpObject;
exports.registerClass = register;
exports.save = save;
exports.load = load;
exports.markPrint = markPrint;