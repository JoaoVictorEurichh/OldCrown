-- Remove tabelas não utilizadas pela aplicação
-- Ordem respeita as dependências de chave estrangeira

DROP TABLE IF EXISTS "Appointment";
DROP TABLE IF EXISTS "Barber";
DROP TABLE IF EXISTS "Service";
DROP TABLE IF EXISTS "Barbershop";
