const hueSlider = document.querySelector("#hue-slider"),
  satSlider = document.querySelector("#sat-slider"),
  lightSlider = document.querySelector("#light-slider"),
  alphaSlider = document.querySelector("#alpha-slider"),
  hexText = document.querySelector(".hex"),
  hslText = document.querySelector(".hsl"),
  colorBox = document.querySelector(".color-box"),
  canvasWheel = document.querySelector("canvas.color-wheel"),
  canvasPoint = document.querySelector("canvas.color-point"),
  ctxWheel = canvasWheel.getContext("2d"),
  ctxPoint = canvasPoint.getContext("2d"),
  pointRadius = 4;

  let hasAlpha = false;
  let radius = 100;



const convertRadiansToDegrees = rad => {
  return (rad + Math.PI) * 180 / Math.PI;
}

const convertDegreesToRadians = deg => {
  return deg * Math.PI / 180;
}

const convertCartesianToPolar = (x, y) => {
  const radius = Math.sqrt(x * x + y * y);
  const theta = Math.atan2(y, x);
  return [radius, theta];
};

const convertPolarToCartesian = (radius, theta) => {
  const x = radius * Math.cos(theta) + radius;
  const y = radius * Math.sin(theta) + radius;
  return [x, y];
};

const hslToHex = (h, s, l) => {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// adapted from https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB
  // expected hue range: [0, 360]
  // expected saturation range: [0, 1]
  // expected lightness range: [0, 1]
  const HSLToRGB = (h, s, l) => {
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [255 * f(0), 255 * f(8), 255 * f(4)];
  };

function updateColor() {
  hasAlpha = alphaSlider.value < 255;

  hex = hslToHex(hueSlider.value, satSlider.value, lightSlider.value);

  hslInner = `${hueSlider.value}, ${satSlider.value}%, ${lightSlider.value}%`;

  if (hasAlpha) {
    hex += parseInt(alphaSlider.value, 10).toString(16).padStart(2, "0");
    hsl = `hsla(${hslInner}, ${(alphaSlider.value / 255).toFixed(1)})`;
  } else {
    hsl = `hsl(${hslInner})`;
  }

  hexText.textContent = hex;
  colorBox.style.backgroundColor = hsl;
  hslText.textContent = hsl;

  const [x,y] = convertPolarToCartesian(radius * satSlider.value / 100, convertDegreesToRadians(hueSlider.value - 180));
  ctxPoint.strokeStyle = "#000";
  ctxPoint.clearRect(0, 0, radius*2, radius*2);
  ctxPoint.beginPath();
  ctxPoint.arc(x + radius - satSlider.value, y + radius - satSlider.value, pointRadius, 0, 2 * Math.PI);
  ctxPoint.stroke();
}

function bindInputs(slider, text, hue = false, light = false) {
  let max = hue ? 360 : 100;
  slider.addEventListener("input", () => {
    text.value = slider.value;
    satSlider.style.background =   `linear-gradient(90deg, hsl(${hueSlider.value}, 0%, ${lightSlider.value}%) 0%, hsl(${hueSlider.value}, 100%, ${lightSlider.value}%) 100%)`;
    lightSlider.style.background = `linear-gradient(90deg, hsl(${hueSlider.value}, ${satSlider.value}%, 0%) 0%, hsl(${hueSlider.value}, ${satSlider.value}%, 50%) 50%, hsl(${hueSlider.value}, ${satSlider.value}%, 100%) 100%)`;
    updateColor();
    if (light) {
      drawHSLCircle(radius);
    }
  });

  text.addEventListener("change", function () {
    if (text.value <= max && text.value > 0) {
      slider.value = text.value;
      this.blur();
      updateColor();
    } else {
      text.value = slider.value;
    }
  });
}

function drawHSLCircle(radius) {
    const image = ctxWheel.createImageData(2 * radius, 2 * radius);
    const data = image.data;
    const rowLength = 2 * radius;
    const pixelWidth = 4; // each pixel requires 4 spaces in the data array (RGBA)
    const alpha = 255;
    const value = lightSlider.value / 100;

    for (let x = -radius; x <= radius; x++) {
        for (let y = -radius; y <= radius; y++) {

        const [distance, theta] = convertCartesianToPolar(x, y);

        // process only (x,y) coordinates that are inside circle
        if (distance <= radius) {

            const hue = convertRadiansToDegrees(theta);

            const saturation = distance / radius;

            // const [red, green, blue] = hsvToRgb(hue, saturation, value);
            let [red, green, blue] = HSLToRGB(hue, saturation, value);

            // find index in data array
            const index = (x + radius + (y + radius) * rowLength) * pixelWidth;

            data[index] = red;
            data[index + 1] = green;
            data[index + 2] = blue;
            data[index + 3] = alpha;
        }
    }
    }

    ctxWheel.putImageData(image, 0, 0);
}









ctxPoint.globalCompositeOperation = "destination-over";
bindInputs(hueSlider, document.querySelector("#hue-value"), true);
bindInputs(satSlider, document.querySelector("#sat-value"));
bindInputs(lightSlider, document.querySelector("#light-value"), false, true);
alphaSlider.addEventListener("input", updateColor);

drawHSLCircle(radius);
updateColor();



