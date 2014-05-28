/**
 * User: hammer
 * Date: 13-9-12
 * Time: 上午9:47
 */

var uiComponents = {};

function registerUIComponent(name, func)
{
    uiComponents[name] = func;
}

function loadUI(thiz, file, bind)
{
    thiz.ui = {};
    var node = cc.BuilderReader.load(file, thiz.owner);
    try
    {
        for(var k in bind)
        {
            if( thiz.owner[k] != null )
            {
                var func = uiComponents[bind[k].ui];
                var parent = thiz.owner[k];
                if( func != null )
                {
                    //create func: func(obj, arg)
                    var ret = func(thiz, bind[k], parent);
                    if( ret.node != null )
                    {//return null node to override parent node
                        thiz.owner[k].addChild(ret.node);
                    }
                    if( bind[k].id != null )
                    {
                        thiz.ui[bind[k].id] = ret.id;
                    }
                }
                else
                {
                    error("loadUI: component("+bind[k].ui+") not registered.");
                }
            }
            else
            {
                error("loadUI: node("+k+") not found.");
            }
        }
    }
    catch(e)
    {
        var fileName = e.fileName;
        var lios = fileName.lastIndexOf("/")+1;
        fileName = fileName.substring(lios);
        error("loadUI: Exception:"+e+"\n @"+ fileName+" :"+ e.lineNumber);
    }
    return node;
}

function initUI()
{
    var item = loadModule("xitem.js");
    registerUIComponent("UIItem", item.UIItem.make);
    var skill = loadModule("skill.js");
    registerUIComponent("UISkill", skill.UISkill.make);
    registerUIComponent("UIButtonL", UIButtonL.make);
    registerUIComponent("UIButtonXL", UIButtonXL.make);
    registerUIComponent("UIScrollView", UIScrollView.make);
    registerUIComponent("UITreasure", UITreasure.make);
    var avatar = loadModule("avatar.js");
    registerUIComponent("UIAvatar", avatar.UIAvatar.make);
    registerUIComponent("UIProgress", ProgressBar.make);
    registerUIComponent("UITextArea", DCTextArea.make);
    registerUIComponent("UIPrice", UIPrice.make);
    registerUIComponent("UIInput", makeInput);
    var gadgets = loadModule("gadgets.js");
    registerUIComponent("UIProperties", gadgets.UIProperties.make);
}

exports.initUI = initUI;
exports.loadUI = loadUI;