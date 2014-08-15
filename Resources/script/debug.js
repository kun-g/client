/**
 * User: hammer
 * Date: 13-8-5
 * Time: 下午3:12
 */

function error(msg)
{
    cc.log("[error]"+msg);
    if( DebugRecorderDungeon.inited ) DebugRecorderDungeon.addDebugMsg("[error]"+msg);
}

function warn(msg)
{
    cc.log("[warning]"+msg);
}

function debug(msg)
{
    cc.log("[debug]"+msg);
    if( DebugRecorderDungeon.inited ) DebugRecorderDungeon.addDebugMsg("[debug]"+msg);
}

function display(key, val)
{
    try{
        var str = JSON.stringify(val);
    }
    catch(e){//in case of cyclic object
        str = undefined;
    }
    if( str == undefined )
    {
        str = ""+val;
    }
    cc.log("[print]"+key+" = "+str);
}

function checkNull(val, str)
{
    if( val == null )
    {
        cc.log("[check NULL]"+str);
        return true;
    }
    return false;
}

function traceStack(){
    try{
        error("#TRACE STACK#");
        //print values
        for(var k in arguments){
            error("ENV["+k+"]="+JSON.stringify(arguments[k])+"\n");
        }
        //make the exception
        var some = null;
        var thing = some.evil;
    }
    catch(e){
        traceError(e);
    }
}

function traceError(err){
    var fileName = err.fileName;
    if( fileName == null ){
        fileName = "no file";
    }
    else{
        var lios = fileName.lastIndexOf("/")+1;
        fileName = fileName.substring(lios);
    }
    var msg = err.message;
    if( msg == undefined ) msg = err;
    error("---ERROR---\n"
        + msg+" @"+ fileName+" :"+ err.lineNumber
        +"\n---STACK---\n"
        + err.stack
    );
}

function printArray(ary){
    var str = "---ARRAY---\n";
    for(var k in ary){
        str += "["+k+"] = "+JSON.stringify(ary[k])+"\n";
    }
    error(str);
}


/********* Debug Recorder *********/
function DebugRecorder(){
    this.DebugMessages = "";
    this.Name = "DefaultDebugMsg";
    this.SavePath = "";
    this.inited = false;
}

DebugRecorder.prototype.init = function(fileName){
    this.DebugMessages = "";
    var docPath = file.getDocumentPath();
    if( fileName != null ) this.Name = fileName;
    this.SavePath = docPath+PATH_DEBUG+this.Name;
    this.inited = true;
    cc.log("[DebugRecorder] Init " + this.Name);
};

DebugRecorder.prototype.addDebugMsg = function(msg){
    if( !this.inited ) return;
    this.DebugMessages += msg+"\n";
};

DebugRecorder.prototype.saveDebugMsg = function(){
    if( !this.inited ) return;
    file.write(this.SavePath, this.DebugMessages);
    cc.log("[DebugRecorder] Save " + this.Name);
};

DebugRecorder.prototype.cleanDebugMsg = function(){
    if( !this.inited ) return;
    this.DebugMessages = "";
    cc.log("[DebugRecorder] Clean " + this.Name);
};

DebugRecorder.prototype.deleteDebugMsg = function(){
    if( !this.inited ) return;
    file.remove(this.SavePath);
    cc.log("[DebugRecorder] Delete " + this.Name);
};

DebugRecorder.prototype.uninit = function() {
    this.DebugMessages = "";
    this.SavePath = "";
    this.inited = false;
    cc.log("[DebugRecorder] Uninit " + this.Name);
};