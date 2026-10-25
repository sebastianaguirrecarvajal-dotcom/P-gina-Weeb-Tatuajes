-- Integridad a nivel de base de datos contra solapamiento de reservas/citas.
--
-- PostgreSQL permite una constraint EXCLUDE con rangos: dos filas del mismo
-- estudio no pueden tener franjas [start, end) que se solapen MIENTRAS su
-- estado ocupe la agenda. Los estados que NO ocupan (RECHAZADA, CANCELADA)
-- quedan excluidos por el WHERE, de modo que al rechazar/cancelar el hueco
-- vuelve a quedar libre, igual que en la lógica de la aplicación.
--
-- Esto es la última línea de defensa: aunque dos solicitudes lleguen en el
-- mismo instante, la base de datos garantizará que solo una ocupe el hueco.

-- Requisito para indexar la igualdad de "studioId" junto al rango en un GiST.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD CONSTRAINT "booking_no_overlap"
  EXCLUDE USING gist (
    "studioId" WITH =,
    tsrange("start", "end") WITH &&
  )
  WHERE (status IN (
    'SOLICITADA', 'EN_REVISION', 'ACEPTADA',
    'CONFIRMADA', 'COMPLETADA', 'REPROGRAMADA'
  ));
