window.App = window.App || {};

window.App.api = {
  _cache: new Map(),
  _urlCache: new Map(),
  _sessionCacheKey: "rick_and_morty_url_cache_v1",

  _fallbackPool: [
    { id: 1, name: "Rick Sanchez", status: "Alive", species: "Human", type: "", gender: "Male", origin: { name: "Earth (C-137)" }, location: { name: "Citadel of Ricks" }, image: "https://rickandmortyapi.com/api/character/avatar/1.jpeg", episode: new Array(51).fill("ep") },
    { id: 2, name: "Morty Smith", status: "Alive", species: "Human", type: "", gender: "Male", origin: { name: "unknown" }, location: { name: "Citadel of Ricks" }, image: "https://rickandmortyapi.com/api/character/avatar/2.jpeg", episode: new Array(51).fill("ep") },
    { id: 3, name: "Summer Smith", status: "Alive", species: "Human", type: "", gender: "Female", origin: { name: "Earth (Replacement Dimension)" }, location: { name: "Earth (Replacement Dimension)" }, image: "https://rickandmortyapi.com/api/character/avatar/3.jpeg", episode: new Array(42).fill("ep") },
    { id: 4, name: "Beth Smith", status: "Alive", species: "Human", type: "", gender: "Female", origin: { name: "Earth (Replacement Dimension)" }, location: { name: "Earth (Replacement Dimension)" }, image: "https://rickandmortyapi.com/api/character/avatar/4.jpeg", episode: new Array(42).fill("ep") },
    { id: 5, name: "Jerry Smith", status: "Alive", species: "Human", type: "", gender: "Male", origin: { name: "Earth (Replacement Dimension)" }, location: { name: "Earth (Replacement Dimension)" }, image: "https://rickandmortyapi.com/api/character/avatar/5.jpeg", episode: new Array(39).fill("ep") },
    { id: 6, name: "Abadango Cluster Princess", status: "Alive", species: "Alien", type: "", gender: "Female", origin: { name: "Abadango" }, location: { name: "Abadango" }, image: "https://rickandmortyapi.com/api/character/avatar/6.jpeg", episode: new Array(1).fill("ep") },
    { id: 7, name: "Abradolf Lincler", status: "unknown", species: "Human", type: "Genetic experiment", gender: "Male", origin: { name: "Earth (Replacement Dimension)" }, location: { name: "Testicle Monster Dimension" }, image: "https://rickandmortyapi.com/api/character/avatar/7.jpeg", episode: new Array(2).fill("ep") },
    { id: 8, name: "Adjudicator Rick", status: "Dead", species: "Human", type: "", gender: "Male", origin: { name: "unknown" }, location: { name: "Citadel of Ricks" }, image: "https://rickandmortyapi.com/api/character/avatar/8.jpeg", episode: new Array(1).fill("ep") },
    { id: 9, name: "Agency Director", status: "Dead", species: "Human", type: "", gender: "Male", origin: { name: "Earth (Replacement Dimension)" }, location: { name: "Earth (Replacement Dimension)" }, image: "https://rickandmortyapi.com/api/character/avatar/9.jpeg", episode: new Array(1).fill("ep") },
    { id: 10, name: "Alan Rails", status: "Dead", species: "Human", type: "Superhuman (Ghost trains summoner)", gender: "Male", origin: { name: "unknown" }, location: { name: "Worldender's lair" }, image: "https://rickandmortyapi.com/api/character/avatar/10.jpeg", episode: new Array(1).fill("ep") },
    { id: 11, name: "Albert Einstein", status: "Dead", species: "Human", type: "", gender: "Male", origin: { name: "Earth (C-137)" }, location: { name: "Earth (Replacement Dimension)" }, image: "https://rickandmortyapi.com/api/character/avatar/11.jpeg", episode: new Array(1).fill("ep") },
    { id: 12, name: "Alexander", status: "Dead", species: "Human", type: "", gender: "Male", origin: { name: "Earth (C-137)" }, location: { name: "Anatomy Park" }, image: "https://rickandmortyapi.com/api/character/avatar/12.jpeg", episode: new Array(1).fill("ep") },
    { id: 13, name: "Alien Googah", status: "unknown", species: "Alien", type: "", gender: "unknown", origin: { name: "unknown" }, location: { name: "Earth (Replacement Dimension)" }, image: "https://rickandmortyapi.com/api/character/avatar/13.jpeg", episode: new Array(1).fill("ep") },
    { id: 14, name: "Alien Morty", status: "unknown", species: "Alien", type: "", gender: "Male", origin: { name: "unknown" }, location: { name: "Citadel of Ricks" }, image: "https://rickandmortyapi.com/api/character/avatar/14.jpeg", episode: new Array(1).fill("ep") },
    { id: 15, name: "Alien Rick", status: "unknown", species: "Alien", type: "", gender: "Male", origin: { name: "unknown" }, location: { name: "Citadel of Ricks" }, image: "https://rickandmortyapi.com/api/character/avatar/15.jpeg", episode: new Array(1).fill("ep") },
    { id: 16, name: "Amish Cyborg", status: "Dead", species: "Alien", type: "Parasite", gender: "Male", origin: { name: "unknown" }, location: { name: "Earth (Replacement Dimension)" }, image: "https://rickandmortyapi.com/api/character/avatar/16.jpeg", episode: new Array(1).fill("ep") },
    { id: 17, name: "Annie", status: "Alive", species: "Human", type: "", gender: "Female", origin: { name: "Earth (C-137)" }, location: { name: "Anatomy Park" }, image: "https://rickandmortyapi.com/api/character/avatar/17.jpeg", episode: new Array(1).fill("ep") },
    { id: 18, name: "Antenna Morty", status: "Alive", species: "Human", type: "Human with antennae", gender: "Male", origin: { name: "unknown" }, location: { name: "Citadel of Ricks" }, image: "https://rickandmortyapi.com/api/character/avatar/18.jpeg", episode: new Array(2).fill("ep") },
    { id: 19, name: "Antenna Rick", status: "unknown", species: "Human", type: "Human with antennae", gender: "Male", origin: { name: "unknown" }, location: { name: "unknown" }, image: "https://rickandmortyapi.com/api/character/avatar/19.jpeg", episode: new Array(1).fill("ep") },
    { id: 20, name: "Ants in my Eyes Johnson", status: "unknown", species: "Human", type: "Human with ants in his eyes", gender: "Male", origin: { name: "unknown" }, location: { name: "Interdimensional Cable" }, image: "https://rickandmortyapi.com/api/character/avatar/20.jpeg", episode: new Array(1).fill("ep") },
    { id: 47, name: "Birdperson", status: "Alive", species: "Alien", type: "Bird-Person", gender: "Male", origin: { name: "Bird World" }, location: { name: "Planet Squanch" }, image: "https://rickandmortyapi.com/api/character/avatar/47.jpeg", episode: new Array(7).fill("ep") },
    { id: 118, name: "Evil Morty", status: "Alive", species: "Human", type: "", gender: "Male", origin: { name: "unknown" }, location: { name: "Citadel of Ricks" }, image: "https://rickandmortyapi.com/api/character/avatar/118.jpeg", episode: new Array(5).fill("ep") },
    { id: 196, name: "Krombopulos Michael", status: "Dead", species: "Alien", type: "Gromflomite", gender: "Male", origin: { name: "unknown" }, location: { name: "unknown" }, image: "https://rickandmortyapi.com/api/character/avatar/196.jpeg", episode: new Array(1).fill("ep") },
    { id: 242, name: "Mr. Meeseeks", status: "unknown", species: "Humanoid", type: "Meeseeks", gender: "Male", origin: { name: "Mr. Meeseeks Box" }, location: { name: "Earth (Replacement Dimension)" }, image: "https://rickandmortyapi.com/api/character/avatar/242.jpeg", episode: new Array(4).fill("ep") },
    { id: 244, name: "Mr. Poopybutthole", status: "Alive", species: "Poopybutthole", type: "", gender: "Male", origin: { name: "unknown" }, location: { name: "Earth (Replacement Dimension)" }, image: "https://rickandmortyapi.com/api/character/avatar/244.jpeg", episode: new Array(8).fill("ep") },
    { id: 265, name: "Pickle Rick", status: "Alive", species: "Human", type: "Pickle", gender: "Male", origin: { name: "Earth (C-137)" }, location: { name: "Earth (Replacement Dimension)" }, image: "https://rickandmortyapi.com/api/character/avatar/265.jpeg", episode: new Array(1).fill("ep") },
    { id: 331, name: "Squanchy", status: "unknown", species: "Alien", type: "Cat-Person", gender: "Male", origin: { name: "Planet Squanch" }, location: { name: "Planet Squanch" }, image: "https://rickandmortyapi.com/api/character/avatar/331.jpeg", episode: new Array(4).fill("ep") }
  ],

  // Usa proxy de imagem global (wsrv.nl) para que os 20 avatares por página não consumam o limite de requisições da API principal
  _normalizeCharacter(c) {
    if (!c || !c.id) return c;
    const rawImage = c.rawImage || c.image || `https://rickandmortyapi.com/api/character/avatar/${c.id}.jpeg`;
    const cdnImage = rawImage.startsWith("https://wsrv.nl/")
      ? rawImage
      : `https://wsrv.nl/?url=${encodeURIComponent(rawImage)}`;
    return {
      ...c,
      rawImage,
      image: cdnImage,
    };
  },

  _normalizeUrlKey(url) {
    const raw = url || `${window.App.config.API_BASE_URL}/character`;
    return raw.replace(/\/character\/\?/, "/character?").replace(/\/character\/$/, "/character");
  },

  _loadSessionCache() {
    if (this._sessionLoaded) return;
    this._sessionLoaded = true;
    try {
      const saved = sessionStorage.getItem(this._sessionCacheKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        Object.entries(parsed).forEach(([k, v]) => {
          this._urlCache.set(k, v);
          if (v && v.results) this._storeInCache(v.results);
        });
      }
    } catch (e) {}
  },

  _saveUrlToCache(key, data) {
    this._urlCache.set(key, data);
    try {
      const obj = {};
      this._urlCache.forEach((v, k) => {
        obj[k] = v;
      });
      sessionStorage.setItem(this._sessionCacheKey, JSON.stringify(obj));
    } catch (e) {}
  },

  _storeInCache(chars) {
    if (!chars) return;
    const list = Array.isArray(chars) ? chars : [chars];
    list.forEach(c => {
      if (c && c.id) {
        const normalized = this._normalizeCharacter(c);
        this._cache.set(Number(normalized.id), normalized);
      }
    });
  },

  getCachedCharacters() {
    this._loadSessionCache();
    if (this._cache.size === 0) {
      this._storeInCache(this._fallbackPool);
    }
    return Array.from(this._cache.values());
  },

  _getRandomFromPool() {
    const pool = this.getCachedCharacters();
    return pool[Math.floor(Math.random() * pool.length)];
  },

  _buildFilteredFallback(targetUrl) {
    const allMap = new Map();
    this._fallbackPool.forEach(c => {
      const norm = this._normalizeCharacter(c);
      allMap.set(Number(norm.id), norm);
    });
    this._cache.forEach((c, id) => allMap.set(Number(id), c));

    let pool = Array.from(allMap.values()).sort((a, b) => a.id - b.id);

    try {
      const urlObj = new URL(targetUrl);
      const statusParam = (urlObj.searchParams.get("status") || "").trim().toLowerCase();
      const nameParam = (urlObj.searchParams.get("name") || "").trim().toLowerCase();

      if (statusParam) {
        pool = pool.filter(c => (c.status || "").toLowerCase() === statusParam);
      }
      if (nameParam) {
        pool = pool.filter(c => (c.name || "").toLowerCase().includes(nameParam));
      }
    } catch (e) {}

    return {
      results: pool.slice(0, 20),
      info: { count: pool.length, pages: 1, next: null, prev: null },
    };
  },

  async fetchCharacters(url = null) {
    this._loadSessionCache();
    const targetUrl = url || `${window.App.config.API_BASE_URL}/character`;
    const cacheKey = this._normalizeUrlKey(targetUrl);

    if (this._urlCache.has(cacheKey)) {
      return this._urlCache.get(cacheKey);
    }

    try {
      let response = await fetch(targetUrl);

      if (response.status === 429) {
        await new Promise(r => setTimeout(r, 650));
        response = await fetch(targetUrl);
      }

      if (!response.ok) {
        if (response.status === 404) {
          const empty = { results: [], info: null };
          this._saveUrlToCache(cacheKey, empty);
          return empty;
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (data && data.results) {
        data.results = data.results.map(c => this._normalizeCharacter(c));
        this._storeInCache(data.results);
      }
      this._saveUrlToCache(cacheKey, data);
      return data;
    } catch (error) {
      console.warn("Usando cache filtrado para:", targetUrl);
      return this._buildFilteredFallback(targetUrl);
    }
  },

  async fetchMultipleCharacters(ids) {
    this._loadSessionCache();
    if (!ids || ids.length === 0) return [];

    const uniqueIds = Array.from(new Set(ids.map(id => Number(id)).filter(Boolean)));
    const missingIds = uniqueIds.filter(id => !this._cache.has(id));

    if (missingIds.length === 0) {
      return uniqueIds.map(id => this._cache.get(id)).filter(Boolean);
    }

    try {
      const url = `${window.App.config.API_BASE_URL}/character/${missingIds.join(",")}`;
      const response = await fetch(url);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const fetched = Array.isArray(data) ? data : [data];
      this._storeInCache(fetched);

      return uniqueIds.map(id => this._cache.get(id)).filter(Boolean);
    } catch (error) {
      const available = uniqueIds.map(id => this._cache.get(id)).filter(Boolean);
      return available.length > 0 ? available : this.getCachedCharacters();
    }
  },

  async fetchRandomCharacter() {
    this._loadSessionCache();
    const randomId = Math.floor(Math.random() * 826) + 1;
    if (this._cache.has(randomId)) {
      return this._cache.get(randomId);
    }

    try {
      const url = `${window.App.config.API_BASE_URL}/character/${randomId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const normalized = this._normalizeCharacter(data);
      this._storeInCache(normalized);
      return normalized;
    } catch (error) {
      return this._getRandomFromPool();
    }
  },
};
