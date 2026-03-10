/**
 * localDB.js — localStorage-based CRUD data layer
 * Fully local, offline-capable store.
 * Data is persisted in localStorage and synced across tabs via BroadcastChannel.
 */

// ─── Helpers ────────────────────────────────────────────────
function generateId() {
    return crypto.randomUUID();
}

function now() {
    return new Date().toISOString();
}

// Simple cross-tab event bus
const channels = {};
function getChannel(name) {
    if (!channels[name]) {
        try {
            channels[name] = new BroadcastChannel(`localdb_${name}`);
        } catch {
            // Fallback for environments without BroadcastChannel
            channels[name] = { postMessage: () => { }, addEventListener: () => { }, removeEventListener: () => { } };
        }
    }
    return channels[name];
}

// ─── Entity Store Factory ───────────────────────────────────
function createEntityStore(entityName) {
    const STORAGE_KEY = `db_${entityName}`;
    const listeners = new Set();

    function _read() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    function _write(items) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }

    function _notify(type, data) {
        const event = { type, data, entity: entityName, timestamp: Date.now() };
        listeners.forEach(fn => {
            try { fn(event); } catch (e) { console.error('[localDB] listener error:', e); }
        });
        // Notify other tabs
        try { getChannel(entityName).postMessage(event); } catch { }
    }

    // Listen for changes from other tabs
    try {
        getChannel(entityName).addEventListener('message', (e) => {
            listeners.forEach(fn => {
                try { fn(e.data); } catch { }
            });
        });
    } catch { }

    return {
        /**
         * List all items, optionally sorted.
         * @param {string} sortField - field name, prefix with '-' for descending
         * @param {number} limit - max items to return
         */
        async list(sortField, limit) {
            let items = _read();
            if (sortField) {
                const desc = sortField.startsWith('-');
                const field = desc ? sortField.slice(1) : sortField;
                items.sort((a, b) => {
                    const va = a[field] ?? '';
                    const vb = b[field] ?? '';
                    if (va < vb) return desc ? 1 : -1;
                    if (va > vb) return desc ? -1 : 1;
                    return 0;
                });
            }
            if (limit) items = items.slice(0, limit);
            return items;
        },

        /**
         * Filter items by criteria.
         * @param {object} criteria - key-value pairs to match
         * @param {string} sortField - optional sort
         */
        async filter(criteria = {}, sortField) {
            let items = _read().filter(item =>
                Object.entries(criteria).every(([k, v]) => item[k] === v)
            );
            if (sortField) {
                const desc = sortField.startsWith('-');
                const field = desc ? sortField.slice(1) : sortField;
                items.sort((a, b) => {
                    const va = a[field] ?? '';
                    const vb = b[field] ?? '';
                    if (va < vb) return desc ? 1 : -1;
                    if (va > vb) return desc ? -1 : 1;
                    return 0;
                });
            }
            return items;
        },

        /**
         * Create a new item.
         */
        async create(data) {
            const items = _read();
            const newItem = {
                ...data,
                id: generateId(),
                created_date: now(),
            };
            items.push(newItem);
            _write(items);
            _notify('create', newItem);
            return newItem;
        },

        /**
         * Update an existing item by ID.
         */
        async update(id, data) {
            const items = _read();
            const idx = items.findIndex(i => i.id === id);
            if (idx === -1) throw new Error(`${entityName} with id ${id} not found`);
            items[idx] = { ...items[idx], ...data };
            _write(items);
            _notify('update', items[idx]);
            return items[idx];
        },

        /**
         * Delete an item by ID.
         */
        async delete(id) {
            let items = _read();
            const item = items.find(i => i.id === id);
            items = items.filter(i => i.id !== id);
            _write(items);
            if (item) _notify('delete', item);
        },

        /**
         * Subscribe to changes.
         * @param {function} callback - (event) => void, event has {type, data}
         * @returns {function} unsubscribe function
         */
        subscribe(callback) {
            listeners.add(callback);
            return () => listeners.delete(callback);
        },

        /**
         * Get a single item by ID.
         */
        async get(id) {
            return _read().find(i => i.id === id) || null;
        },
    };
}

// ─── Seed Data ──────────────────────────────────────────────
function seedIfEmpty() {
    // Categories
    if (!localStorage.getItem('db_Category')) {
        const cats = [
            { id: 'cat-1', name: 'Entrées', icon: '🥗', display_order: 0, is_active: true, created_date: now() },
            { id: 'cat-2', name: 'Plats', icon: '🍽️', display_order: 1, is_active: true, created_date: now() },
            { id: 'cat-3', name: 'Boissons', icon: '🥤', display_order: 2, is_active: true, created_date: now() },
            { id: 'cat-4', name: 'Desserts', icon: '🍰', display_order: 3, is_active: true, created_date: now() },
        ];
        localStorage.setItem('db_Category', JSON.stringify(cats));
    }

    // Products
    if (!localStorage.getItem('db_Product')) {
        const products = [
            { id: 'prod-1', name: 'Salade César', description: 'Laitue, parmesan, croutons, sauce césar', price: 8.50, category_id: 'cat-1', image_url: '', stock: 20, is_active: true, created_date: now() },
            { id: 'prod-2', name: 'Soupe à l\'oignon', description: 'Soupe gratinée traditionnelle', price: 6.00, category_id: 'cat-1', image_url: '', stock: 15, is_active: true, created_date: now() },
            { id: 'prod-3', name: 'Burger Classic', description: 'Bœuf, cheddar, salade, tomate, sauce maison', price: 14.50, category_id: 'cat-2', image_url: '', stock: 25, is_active: true, created_date: now() },
            { id: 'prod-4', name: 'Pizza Margherita', description: 'Mozzarella, tomate, basilic frais', price: 12.00, category_id: 'cat-2', image_url: '', stock: 30, is_active: true, created_date: now() },
            { id: 'prod-5', name: 'Pâtes Carbonara', description: 'Spaghetti, lardons, crème, parmesan', price: 13.00, category_id: 'cat-2', image_url: '', stock: 20, is_active: true, created_date: now() },
            { id: 'prod-6', name: 'Coca-Cola', description: '33cl', price: 3.50, category_id: 'cat-3', image_url: '', stock: 50, is_active: true, created_date: now() },
            { id: 'prod-7', name: 'Eau minérale', description: 'Evian 50cl', price: 2.50, category_id: 'cat-3', image_url: '', stock: 50, is_active: true, created_date: now() },
            { id: 'prod-8', name: 'Jus d\'orange', description: 'Pressé frais', price: 4.00, category_id: 'cat-3', image_url: '', stock: 30, is_active: true, created_date: now() },
            { id: 'prod-9', name: 'Tiramisu', description: 'Mascarpone, café, cacao', price: 7.50, category_id: 'cat-4', image_url: '', stock: 12, is_active: true, created_date: now() },
            { id: 'prod-10', name: 'Crème brûlée', description: 'Vanille bourbon', price: 6.50, category_id: 'cat-4', image_url: '', stock: 10, is_active: true, created_date: now() },
        ];
        localStorage.setItem('db_Product', JSON.stringify(products));
    }

    // Orders — start empty
    if (!localStorage.getItem('db_Order')) {
        localStorage.setItem('db_Order', JSON.stringify([]));
    }

    // RestaurantSettings
    if (!localStorage.getItem('db_RestaurantSettings')) {
        const settings = [{
            id: 'settings-1',
            restaurant_name: 'Mon Restaurant',
            table_count: 6,
            currency: 'EUR',
            counter_password: '1234',
            is_open: true,
            created_date: now(),
        }];
        localStorage.setItem('db_RestaurantSettings', JSON.stringify(settings));
    }
}

// Run seed on module load
seedIfEmpty();

// ─── Exported DB object ─────────────────────────────────────
export const db = {
    entities: {
        Category: createEntityStore('Category'),
        Product: createEntityStore('Product'),
        Order: createEntityStore('Order'),
        RestaurantSettings: createEntityStore('RestaurantSettings'),
    },
};
