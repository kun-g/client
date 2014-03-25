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
    this.Flags = {};
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

exports.Player = Player;