// Deliberately extreme, retained 6,000-grain fixture. Hexagonal initial packing
// avoids making the benchmark a test of an initially interpenetrating cloud.
export function fillStressScene(sim) {
  sim.ridges.add({ x: 1, y: 169 }, { x: 159, y: 169 });
  sim.ridges.add({ x: 5, y: 20 }, { x: 5, y: 169 });
  sim.ridges.add({ x: 155, y: 20 }, { x: 155, y: 169 });
  for (let row = 0; row < 60; row++)
    for (let column = 0; column < 100; column++) {
      sim.addGrain(
        15 + column * 1.3 + (row % 2) * 0.65,
        167.35 - (row * 1.3 * Math.sqrt(3)) / 2,
      );
    }
  sim.emitted = 6000;
  sim.pouring = false;
}
