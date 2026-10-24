window.App = window.App || {};

class GameEngine {
  constructor() {
    this.squad = [];
    this.currentFighterIndex = 0;
    this.enemy = null;
    this.stage = 1;
    this.gameState = "squad_selection";
    this.turn = "player";

    this.playerSpecialCooldown = 0;
    this.enemySpecialCooldown = 0;
    this.flurbosEarned = 0;
    this.coinMultiplier = 1.0;

    this.tempEffects = {
      reflectCharges: 0,
      bonusCritCharges: 0,
      bonusCritValue: 0,
      lifestealCharges: 0,
      lifestealValue: 0,
      absorbCharges: 0,
      stunCharges: 0,
      blockCharges: 0,
      executeCharges: 0,
    };
  }

  start(deckIds) {
    this.squad = [];
    this.currentFighterIndex = 0;
    this.stage = 1;
    this.gameState = "squad_selection";
    this.flurbosEarned = 0;
    this.coinMultiplier = 1.0;
    this.tempEffects = {
      reflectCharges: 0,
      bonusCritCharges: 0,
      bonusCritValue: 0,
      lifestealCharges: 0,
      lifestealValue: 0,
      absorbCharges: 0,
      stunCharges: 0,
      blockCharges: 0,
      executeCharges: 0,
      angelCharges: 0,
      sleepCharges: 0,
    };
  }

  addToSquad(character) {
    const eco = window.App.state
      ? window.App.state.getEconomy()
      : { maxDeckSize: 1 };
    if (
      this.squad.length < eco.maxDeckSize &&
      !this.squad.find((c) => c.id === character.id)
    ) {
      this.squad.push(this._calculateStats(character, true));
      return true;
    }
    return false;
  }

  removeFromSquad(characterId) {
    this.squad = this.squad.filter((c) => c.id !== characterId);
  }

  isSquadFull() {
    const eco = window.App.state
      ? window.App.state.getEconomy()
      : { maxDeckSize: 1 };
    return this.squad.length === eco.maxDeckSize;
  }

  beginJourney() {
    if (!this.isSquadFull()) return false;
    this.gameState = "battle";
    this.currentFighterIndex = 0;
    this.playerSpecialCooldown = 0;
    return true;
  }

  generateEnemy(apiCharacter) {
    let stats = this._calculateStats(apiCharacter, false);
    // Escala os atributos do inimigo progressivamente conforme o estágio
    const multiplier = 1 + this.stage * 0.25 * Math.pow(1.05, this.stage);
    stats.maxHp = Math.floor(stats.maxHp * multiplier);
    stats.hp = stats.maxHp;
    stats.baseAttack = Math.floor(stats.baseAttack * multiplier);
    stats.specialAttack = Math.floor(stats.specialAttack * multiplier);

    this.enemy = stats;
    this.enemySpecialCooldown = 0;
    this.turn = "player";
    return this.enemy;
  }

  _calculateStats(char, isPlayer) {
    const baseStats = window.App.state
      ? window.App.state.calculateAttributes(char)
      : { vida: 50, forca: 50, inteligencia: 50, sorte: 50 };

    const maxHp = Math.floor(50 + baseStats.vida * 1.5);
    const baseAttack = Math.max(1, Math.floor(baseStats.forca / 3));
    const specialAttack = Math.max(5, Math.floor(baseStats.inteligencia / 2));
    const dodgeChance = Math.min(
      45,
      Math.floor((baseStats.sorte + baseStats.inteligencia) / 4),
    );
    const critChance = Math.min(50, Math.floor(baseStats.sorte / 2));

    return {
      ...char,
      maxHp,
      hp: maxHp,
      baseAttack,
      specialAttack,
      dodgeChance,
      critChance,
    };
  }

  getCurrentFighter() {
    return this.squad[this.currentFighterIndex];
  }

  attack(isSpecial = false) {
    if (this.gameState !== "battle" || this.turn !== "player") return null;

    const attacker = this.getCurrentFighter();
    const defender = this.enemy;

    let result = this._processCombat(attacker, defender, isSpecial);

    if (isSpecial) {
      this.playerSpecialCooldown = 2;
    } else if (this.playerSpecialCooldown > 0) {
      this.playerSpecialCooldown--;
    }

    if (defender.hp <= 0) {
      defender.hp = 0;
      this.gameState = "stage_clear";
      let earned = this._awardFlurbos();
      result.log += ` Você derrotou ${defender.name} e achou +${earned} Flurbos!`;
    } else {
      this.turn = "enemy";
    }

    return result;
  }

  _awardFlurbos() {
    let base = 10;
    if (this.stage >= 16) base = 50;
    else if (this.stage >= 11) base = 35;
    else if (this.stage >= 6) base = 20;

    let reward = Math.floor(base * this.coinMultiplier);
    this.flurbosEarned += reward;
    if (window.App.state) window.App.state.addFlurbos(reward);
    return reward;
  }

  enemyTurn() {
    if (this.gameState !== "battle" || this.turn !== "enemy") return null;

    const attacker = this.enemy;
    const defender = this.getCurrentFighter();

    if (this.tempEffects && this.tempEffects.stunCharges > 0) {
      this.tempEffects.stunCharges--;
      this.turn = "player";
      return {
        damage: 0,
        dodged: false,
        crit: false,
        log: `O tempo parou! ${attacker.name} está congelado em ESTASE e pulou o turno! (${this.tempEffects.stunCharges} turnos restantes)`,
        stunned: true,
      };
    }

    let useSpecial = false;
    if (this.enemySpecialCooldown === 0) {
      useSpecial = true;
      this.enemySpecialCooldown = 2;
    } else if (this.enemySpecialCooldown > 0) {
      this.enemySpecialCooldown--;
    }

    let result = this._processCombat(attacker, defender, useSpecial);

    if (attacker.hp <= 0) {
      attacker.hp = 0;
      result.log +=
        " " + attacker.name + " se destruiu com o próprio ataque refletido!";
      this.gameState = "stage_clear";
      const earned = this._awardFlurbos();
      result.log += ` Você achou +${earned} Flurbos!`;
      return result;
    }

    if (defender.hp <= 0) {
      defender.hp = 0;
      result.log += ` ${defender.name} foi derrotado!`;

      // Procura o próximo lutador vivo no esquadrão (circular)
      let nextIndex = -1;
      for (let i = 1; i <= this.squad.length; i++) {
        const candidateIdx = (this.currentFighterIndex + i) % this.squad.length;
        if (this.squad[candidateIdx].hp > 0) {
          nextIndex = candidateIdx;
          break;
        }
      }

      if (nextIndex !== -1) {
        this.currentFighterIndex = nextIndex;
        this.playerSpecialCooldown = 0;
        result.fighterSwitched = true;
        result.log += ` ${this.squad[this.currentFighterIndex].name} entra na arena!`;
        this.turn = "player";
      } else {
        if (this.tempEffects && this.tempEffects.angelCharges > 0) {
          this.tempEffects.angelCharges--;
          this.squad.forEach((c) => (c.hp = Math.floor(c.maxHp * 0.5)));
          this.currentFighterIndex = 0;
          this.playerSpecialCooldown = 0;
          result.log +=
            " MILAGRE! O Anjo da Guarda desceu dos céus e reviveu seu esquadrão!";
          this.turn = "player";
          result.angelRevived = true;
          return result;
        }
        this.gameState = "game_over";
        result.log += ` Game Over. Seu esquadrão foi dizimado no estágio ${this.stage}.`;
        if (this.stage === 1) {
          this.flurbosEarned += 2;
          if (window.App.state) window.App.state.addFlurbos(2);
        }
      }
    } else {
      this.turn = "player";
    }

    return result;
  }

  _processCombat(attacker, defender, isSpecial) {
    if (
      attacker === this.enemy &&
      this.tempEffects &&
      this.tempEffects.reflectCharges > 0
    ) {
      this.tempEffects.reflectCharges--;

      let damage = isSpecial
        ? attacker.specialAttack + Math.floor(Math.random() * 11) + 5
        : attacker.baseAttack + Math.floor(Math.random() * 10) + 1;
      attacker.hp -= damage;

      let moveName = isSpecial ? "Ataque Especial" : "Ataque";
      let log = `REFLEXÃO: O ${moveName} de ${attacker.name} foi refletido! Sofreu ${damage} de dano! (${this.tempEffects.reflectCharges} cargas restantes)`;
      return { damage, dodged: false, crit: false, log, reflected: true };
    }

    if (
      attacker === this.enemy &&
      this.tempEffects &&
      this.tempEffects.blockCharges > 0
    ) {
      this.tempEffects.blockCharges--;
      let moveName = isSpecial ? "Ataque Especial" : "Ataque";
      return {
        damage: 0,
        dodged: false,
        crit: false,
        log: `BLOQUEIO: O ${moveName} de ${attacker.name} colidiu com o Escudo de Neutrinos! (${this.tempEffects.blockCharges} cargas restantes)`,
        blocked: true,
      };
    }

    if (Math.random() * 100 < defender.dodgeChance) {
      return {
        damage: 0,
        dodged: true,
        crit: false,
        log: `${defender.name} esquivou do ataque!`,
      };
    }

    let damage = isSpecial
      ? attacker.specialAttack + Math.floor(Math.random() * 11) + 5
      : attacker.baseAttack + Math.floor(Math.random() * 10) + 1;

    let isCrit = false;
    let finalCritChance = attacker.critChance;

    let isSleeping = false;
    if (
      attacker === this.enemy &&
      this.tempEffects &&
      this.tempEffects.sleepCharges > 0
    ) {
      damage = Math.floor(damage / 2);
      finalCritChance = 0;
      isSleeping = true;
      this.tempEffects.sleepCharges--;
    }

    let usedCritBuff = false;
    if (
      attacker !== this.enemy &&
      this.tempEffects &&
      this.tempEffects.bonusCritCharges > 0
    ) {
      finalCritChance += this.tempEffects.bonusCritValue;
      this.tempEffects.bonusCritCharges--;
      usedCritBuff = true;
    }

    if (Math.random() * 100 < finalCritChance) {
      damage = Math.floor(damage * 1.5);
      isCrit = true;
    }

    let moveName = isSpecial ? "Ataque Especial" : "Ataque";
    let log = "";
    let absorbed = false;

    if (
      attacker === this.enemy &&
      this.tempEffects &&
      this.tempEffects.absorbCharges > 0
    ) {
      this.tempEffects.absorbCharges--;
      defender.hp = Math.min(defender.hp + damage, defender.maxHp);
      absorbed = true;
      log = `ABSORÇÃO: O ${moveName} de ${attacker.name} curou você em ${damage} HP! (${this.tempEffects.absorbCharges} cargas restantes)`;
      damage = 0;
    } else {
      defender.hp -= damage;
      log = `${attacker.name} usou ${moveName} e causou ${damage} de dano!`;
    }

    let healedAmount = 0;
    if (
      attacker !== this.enemy &&
      this.tempEffects &&
      this.tempEffects.lifestealCharges > 0
    ) {
      this.tempEffects.lifestealCharges--;
      healedAmount = Math.floor(
        damage * (this.tempEffects.lifestealValue / 100),
      );
      attacker.hp = Math.min(attacker.hp + healedAmount, attacker.maxHp);
    }

    let executed = false;
    if (
      attacker !== this.enemy &&
      this.tempEffects &&
      this.tempEffects.executeCharges > 0 &&
      defender.hp > 0
    ) {
      if (defender.hp <= defender.maxHp * 0.4) {
        defender.hp = 0;
        log += ` [EXECUÇÃO] A Munição Perfurante obliterou o inimigo!`;
        executed = true;
      }
      this.tempEffects.executeCharges--;
    }

    if (isCrit && !absorbed) log += " Acerto Crítico!";
    if (usedCritBuff && !absorbed) log += ` [Buff de Crítico consumido]`;
    if (healedAmount > 0)
      log += ` Sugou ${healedAmount} de HP! [${this.tempEffects.lifestealCharges} cargas restantes]`;

    if (isSleeping) log += ` [Sonolento: dano reduzido pela metade]`;

    return {
      damage,
      dodged: false,
      crit: isCrit,
      log,
      absorbed,
      blocked: false,
      executed,
      reflected: false,
      healed: healedAmount > 0 || absorbed,
      slept: isSleeping,
    };
  }

  applyBuff(buffType) {
    if (buffType === "coin_detector") {
      this.coinMultiplier += 0.1;
    } else if (buffType === "blemflarck") {
      this.coinMultiplier += 0.5;
    } else if (buffType === "portal_skip") {
      this.stage += 1;
    } else if (buffType === "reflect_mirror") {
      this.tempEffects.reflectCharges += 3;
    } else if (buffType === "temp_crit") {
      this.tempEffects.bonusCritCharges += 3;
      this.tempEffects.bonusCritValue = 100;
    } else if (buffType === "temp_lifesteal") {
      this.tempEffects.lifestealCharges += 3;
      this.tempEffects.lifestealValue = 50;
    } else if (buffType === "temp_absorb") {
      this.tempEffects.absorbCharges += 3;
    } else if (buffType === "temp_stun") {
      this.tempEffects.stunCharges += 2;
    } else if (buffType === "temp_block") {
      this.tempEffects.blockCharges += 2;
    } else if (buffType === "temp_execute") {
      this.tempEffects.executeCharges += 2;
    } else if (buffType === "temp_angel") {
      this.tempEffects.angelCharges = 1;
    } else if (buffType === "temp_sleep") {
      this.tempEffects.sleepCharges += 3;
    } else if (buffType === "temp_regen") {
      window.App.ui.startRegeneration(this);
    } else if (buffType === "loan") {
      if (window.App.state) window.App.state.addFlurbos(30);
      this.flurbosEarned += 30;
    } else if (buffType === "revive") {
      this.squad.forEach((c) => {
        let currentHp = Math.max(0, c.hp);
        c.hp = Math.min(c.maxHp, currentHp + Math.floor(c.maxHp * 0.5));
      });
    }

    const activeFighter = this.getCurrentFighter();

    this.squad.forEach((c) => {
      if (c.hp > 0) {
        const isCurrent = c === activeFighter;
        const wasFullHp = c.hp >= c.maxHp;

        switch (buffType) {
          case "heal":
            c.hp = Math.min(c.maxHp, c.hp + Math.floor(c.maxHp * 0.5));
            break;
          case "fullheal":
            c.hp = c.maxHp;
            break;
          case "attack":
            c.baseAttack = Math.floor(c.baseAttack * 1.3);
            break;
          case "special":
            c.specialAttack = Math.floor(c.specialAttack * 1.4);
            break;
          case "luck":
            c.dodgeChance = Math.min(50, c.dodgeChance + 10);
            c.critChance = Math.min(50, c.critChance + 10);
            break;
          case "maxhp": {
            const oldMax = c.maxHp;
            c.maxHp = Math.floor(c.maxHp * 1.4);
            c.hp = wasFullHp
              ? c.maxHp
              : Math.min(c.maxHp, c.hp + Math.floor(oldMax * 0.4));
            break;
          }
          case "glasscannon":
            c.baseAttack = Math.floor(c.baseAttack * 2.0);
            c.maxHp = Math.floor(c.maxHp * 0.7);
            c.hp = Math.min(c.hp, c.maxHp);
            break;
          case "vampire":
            c.maxHp = Math.floor(c.maxHp * 1.2);
            c.baseAttack = Math.floor(c.baseAttack * 1.2);
            c.hp = c.maxHp;
            break;
          case "tank":
            c.maxHp = Math.floor(c.maxHp * 1.8);
            c.hp = c.maxHp;
            c.dodgeChance = 0;
            break;
          case "berserker":
            c.baseAttack = Math.floor(c.baseAttack * 1.5);
            c.critChance = Math.min(60, c.critChance + 25);
            // Penalidade de HP aplica apenas no lutador ativo
            if (isCurrent) c.hp = Math.max(1, Math.floor(c.hp * 0.5));
            break;
          case "brain":
            c.specialAttack = Math.floor(c.specialAttack * 2.0);
            c.baseAttack = Math.floor(c.baseAttack * 0.5);
            break;
          case "omega":
            c.maxHp = Math.floor(c.maxHp * 1.15);
            c.hp = c.maxHp;
            c.baseAttack = Math.floor(c.baseAttack * 1.15);
            c.specialAttack = Math.floor(c.specialAttack * 1.15);
            c.critChance = Math.min(50, c.critChance + 5);
            c.dodgeChance = Math.min(50, c.dodgeChance + 5);
            break;
          case "loan":
            c.baseAttack = Math.floor(c.baseAttack * 0.5);
            break;
          case "dark_matter":
            c.baseAttack = Math.floor(c.baseAttack * 3);
            c.specialAttack = Math.floor(c.specialAttack * 3);
            if (isCurrent) c.hp = 1;
            break;
          case "microverse":
            c.maxHp = Math.floor(c.maxHp * 0.5);
            c.hp = Math.min(c.hp, c.maxHp);
            c.dodgeChance = Math.min(90, c.dodgeChance + 50);
            c.critChance = Math.min(100, c.critChance + 50);
            break;
          case "blemflarck":
            c.baseAttack = Math.floor(c.baseAttack * 0.75);
            break;
          case "portal_skip":
            if (isCurrent) {
              let damage = Math.floor(c.maxHp * 0.2);
              c.hp = Math.max(1, c.hp - damage);
            }
            break;
          case "mind_swap":
            let oldAttack = c.baseAttack;
            let oldMaxHp = c.maxHp;
            c.baseAttack = oldMaxHp;
            c.maxHp = oldAttack;
            c.hp = wasFullHp ? c.maxHp : Math.min(c.hp, c.maxHp);
            if (c.hp <= 0) c.hp = 1;
            break;
        }
      }
    });
  }

  nextStage() {
    this.stage++;
    this.gameState = "battle";
    this.turn = "player";
    this.playerSpecialCooldown = 0;
  }
}

window.App.GameEngine = new GameEngine();
