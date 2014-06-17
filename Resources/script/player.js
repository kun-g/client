/**
 * User: hammer
 * Date: 13-9-28
 * Time: 上午9:49
 */

var ENERGY_INVERVAL = 6*60*1000;//every 6 minutes recovery one point
var MAX_ENERGY = 100;

function Player()
{
    this.Energy = 0;
    this.EnergyTimer = engine.game.getServerTime();
    this.Tutorial = 0;
    this.RMB = 0;
    this.AID = -1;
    this.MonthCardCount = -1;
    this.Flags = {};
    this.PkInfo = {
        rank: -1,
        total: 0,
        complete: 0,
        bonusPond: 0
    };
}

Player.prototype.setEnergy = function(energy, timer){
    this.Energy = Math.floor(energy);
    var rewind = (energy - this.Energy)*ENERGY_INVERVAL;
    this.EnergyTimer = timer - rewind;
}

Player.prototype.updateEnergy = function()
{
    var now = engine.game.getServerTime();
    if( now - this.EnergyTimer > ENERGY_INVERVAL
        && this.Energy < MAX_ENERGY )
    {
        this.Energy++;
        this.EnergyTimer = now;
    }
}

Player.prototype.energyCountdown = function(){
    var now = engine.game.getServerTime();
    var past = now - this.EnergyTimer;
    if( past < 0 ) past = 0;
    var left = ENERGY_INVERVAL - past;
    if( left < 0 ) left = 0;
    return left;
}

Player.prototype.estimateEnergyRecoverTimer = function(){
    var energyLoss = MAX_ENERGY - this.Energy;
    var now = Date.now().valueOf();
    now += energyLoss*ENERGY_INVERVAL;
    return now;
}

Player.prototype.checkUnlock = function(key){
    var libTable = loadModule("table.js");
    var tc = libTable.readTable(TABLE_TUTORIAL_CONFIG);
    var ret = true;
    if( tc[key] != null ){
        var feature = tc[key];
        if( feature.flag != null ){
            if( this.Flags[feature.flag] != true ){
                ret = false;
            }
        }
        if( feature.tutorialStage != null ){
            if( this.Tutorial < feature.tutorialStage ){
                ret = false;
            }
        }
    }
    if( !ret && feature.refuseDialogue != null ){
        engine.dialogue.startDialogue(feature.refuseDialogue);
    }
    return ret;
}

exports.Player = Player;