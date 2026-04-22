-- 20 starter categories for launch in Lagos.
-- Idempotent: uses ON CONFLICT (slug) DO NOTHING.
INSERT INTO categories (name, slug, description) VALUES
  ('Plumber', 'plumber', 'Pipes, leaks, taps, water heaters, drainage'),
  ('Electrician', 'electrician', 'Wiring, sockets, lighting, inverters, breakers'),
  ('Carpenter', 'carpenter', 'Furniture, wardrobes, doors, kitchen cabinets'),
  ('Tailor', 'tailor', 'Bespoke clothing, alterations, repairs'),
  ('AC Technician', 'ac-technician', 'AC installation, servicing, gas refill, repairs'),
  ('Painter', 'painter', 'Interior and exterior painting, POP finishing'),
  ('Mechanic', 'mechanic', 'Car servicing, diagnostics, engine and gearbox repairs'),
  ('Mason', 'mason', 'Bricklaying, tiling, concrete and plastering work'),
  ('Welder', 'welder', 'Gates, burglary-proof, metal fabrication'),
  ('Generator Repair', 'generator-repair', 'Generator servicing, rewiring, parts replacement'),
  ('DSTV / Satellite Installer', 'satellite-installer', 'DSTV, GOtv, StarTimes, CCTV cabling'),
  ('Cleaner', 'cleaner', 'Home, office, post-construction and fumigation cleaning'),
  ('Hair Stylist', 'hair-stylist', 'Braiding, weaves, cuts, home service'),
  ('Makeup Artist', 'makeup-artist', 'Bridal, event and studio makeup'),
  ('Caterer', 'caterer', 'Event catering, small chops, home chef service'),
  ('Photographer', 'photographer', 'Events, portraits, weddings, product shoots'),
  ('Driver', 'driver', 'Personal, corporate and on-demand drivers'),
  ('Gardener', 'gardener', 'Lawn care, landscaping, tree trimming'),
  ('Pest Control', 'pest-control', 'Fumigation, termite, rodent and insect control'),
  ('Locksmith', 'locksmith', 'Lock repair and replacement, key cutting, car keys')
ON CONFLICT (slug) DO NOTHING;
