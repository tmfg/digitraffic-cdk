CREATE TABLE `key_figures` (
    id INTEGER NOT NULL,
    `from` DATE NOT NULL,
    `to` DATE NOT NULL,
    name VARCHAR(255) NOT NULL,
    filter VARCHAR(255) NOT NULL,
    query TEXT NOT NULL,
    value TEXT NOT NULL
);
