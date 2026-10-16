/**
 * tinyNet.js – logistic regression and a one-hidden-layer neural network in
 * ~80 lines of plain JavaScript. No library: this is (a tiny version of) what
 * scikit-learn and Keras do for you.
 *
 * Both models output P(class 1 | x, y) and learn with full-batch gradient
 * descent on binary cross-entropy. trainEpoch() MUTATES the model (fast; the
 * React component keeps it in a ref, not in state).
 */
const sigmoid = (z) => 1 / (1 + Math.exp(-z));
const crossEntropy = (p, label) => -(label * Math.log(p + 1e-9) + (1 - label) * Math.log(1 - p + 1e-9));

/** kind: 'logistic' | 'mlp'. `random` is a seeded generator → reproducible starts. */
export function createModel(kind, hidden, random) {
  const init = (scale) => (random() * 2 - 1) * scale;
  if (kind === 'logistic') return { kind, w: [init(0.5), init(0.5)], b: 0 };
  return {
    kind,
    hidden,
    W1: Array.from({ length: hidden }, () => [init(2), init(2)]), // input → hidden
    b1: Array.from({ length: hidden }, () => init(1)),
    W2: Array.from({ length: hidden }, () => init(1)), // hidden → output
    b2: 0,
  };
}

/** Forward pass. Returns the probability and (for the MLP) the hidden activations. */
function forward(model, x, y) {
  if (model.kind === 'logistic') return { p: sigmoid(model.w[0] * x + model.w[1] * y + model.b) };
  const h = model.W1.map(([a, b], j) => Math.tanh(a * x + b * y + model.b1[j]));
  const z = h.reduce((sum, hj, j) => sum + model.W2[j] * hj, model.b2);
  return { p: sigmoid(z), h };
}

export const predict = (model, x, y) => forward(model, x, y).p;

/** P(class 1) at every cell of an n × n grid over [-extent, extent]² (row 0 = the TOP of the plot). */
export function probabilityGrid(model, n, extent) {
  const grid = new Float64Array(n * n);
  const step = (2 * extent) / n;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) grid[j * n + i] = predict(model, -extent + (i + 0.5) * step, extent - (j + 0.5) * step);
  }
  return grid;
}

/** One epoch of gradient descent over all points. Returns the mean loss. */
export function trainEpoch(model, points, learningRate) {
  const n = points.length;
  if (n === 0) return 0;
  let loss = 0;
  if (model.kind === 'logistic') {
    const grad = { w0: 0, w1: 0, b: 0 };
    for (const pt of points) {
      const { p } = forward(model, pt.x, pt.y);
      const error = p - pt.label; // d(loss)/d(z) for sigmoid + cross-entropy
      grad.w0 += error * pt.x;
      grad.w1 += error * pt.y;
      grad.b += error;
      loss += crossEntropy(p, pt.label);
    }
    model.w[0] -= (learningRate * grad.w0) / n;
    model.w[1] -= (learningRate * grad.w1) / n;
    model.b -= (learningRate * grad.b) / n;
    return loss / n;
  }

  // MLP: forward, then BACKPROPAGATION – the chain rule, from the output back to the input.
  const H = model.hidden;
  const gW1 = Array.from({ length: H }, () => [0, 0]);
  const gb1 = new Array(H).fill(0);
  const gW2 = new Array(H).fill(0);
  let gb2 = 0;
  for (const pt of points) {
    const { p, h } = forward(model, pt.x, pt.y);
    const error = p - pt.label;
    loss += crossEntropy(p, pt.label);
    gb2 += error;
    for (let j = 0; j < H; j++) {
      gW2[j] += error * h[j];
      const dh = error * model.W2[j] * (1 - h[j] * h[j]); // tanh'(z) = 1 - tanh(z)²
      gW1[j][0] += dh * pt.x;
      gW1[j][1] += dh * pt.y;
      gb1[j] += dh;
    }
  }
  for (let j = 0; j < H; j++) {
    model.W2[j] -= (learningRate * gW2[j]) / n;
    model.W1[j][0] -= (learningRate * gW1[j][0]) / n;
    model.W1[j][1] -= (learningRate * gW1[j][1]) / n;
    model.b1[j] -= (learningRate * gb1[j]) / n;
  }
  model.b2 -= (learningRate * gb2) / n;
  return loss / n;
}

/** Share of points on the correct side of the 0.5 boundary. */
export function accuracy(model, points) {
  if (points.length === 0) return 0;
  const correct = points.filter((pt) => (predict(model, pt.x, pt.y) >= 0.5 ? 1 : 0) === pt.label).length;
  return correct / points.length;
}
