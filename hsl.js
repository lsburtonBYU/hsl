const hueSlider = document.querySelector("#hue-slider"),
  satSlider = document.querySelector("#sat-slider"),
  lightSlider = document.querySelector("#light-slider"),
  alphaSlider = document.querySelector("#alpha-slider"),
  hexText = document.querySelector(".hex"),
  hslText = document.querySelector(".hsl"),
  colorBox = document.querySelector(".color-box"),
  radius = 100,
  ctxWheel = document.querySelector("canvas.color-wheel").getContext("2d"),
  ctxPoint = document.querySelector("canvas.color-point").getContext("2d"),
  pointRadius = 4;

  let hasAlpha = false;

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

function bindInputs(slider, text, hue = false) {
  let max = 100;
  if (hue) {
    max = 360;
    slider.addEventListener("input", () => {
      text.value = slider.value;
      satSlider.style.background = `linear-gradient(90deg, hsl(${hueSlider.value}, 0%, 50%) 0%, hsl(${hueSlider.value}, 100%, 50%) 100%)`;

      lightSlider.style.background = `linear-gradient(90deg, #000 0%, hsl(${hueSlider.value}, 100%, 50%) 50%, #fff 100%)`;

      updateColor();
    });
  } else {
    slider.addEventListener("input", () => {
      text.value = slider.value;
      updateColor();
    });
  }
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
    const value = .5;

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

/**
 * Convert HSV to RGB value
 * See: https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSV
 * @param {float} hue
 * @param {float} saturation
 * @param {float} value
 * @returns [r,g,b] each in range [0,255]
 */
function hsvToRgb(hue, saturation, value) {
  let chroma = value * saturation;
  let hue1 = hue / 60;
  let x = chroma * (1 - Math.abs(hue1 % 2 - 1));
  let r1, g1, b1;
  if (hue1 >= 0 && hue1 <= 1) {
    [r1, g1, b1] = [chroma, x, 0];
  } else if (hue1 >= 1 && hue1 <= 2) {
    [r1, g1, b1] = [x, chroma, 0];
  } else if (hue1 >= 2 && hue1 <= 3) {
    [r1, g1, b1] = [0, chroma, x];
  } else if (hue1 >= 3 && hue1 <= 4) {
    [r1, g1, b1] = [0, x, chroma];
  } else if (hue1 >= 4 && hue1 <= 5) {
    [r1, g1, b1] = [x, 0, chroma];
  } else if (hue1 >= 5 && hue1 <= 6) {
    [r1, g1, b1] = [chroma, 0, x];
  }

  let m = value - chroma;
  let [r, g, b] = [r1 + m, g1 + m, b1 + m];

  // Change r,g,b values from [0,1] to [0,255]
  return [255 * r, 255 * g, 255 * b];
}







ctxPoint.globalCompositeOperation = "destination-over";
bindInputs(hueSlider, document.querySelector("#hue-value"), true);
bindInputs(satSlider, document.querySelector("#sat-value"));
bindInputs(lightSlider, document.querySelector("#light-value"));
alphaSlider.addEventListener("input", updateColor);


drawHSLCircle(radius);
updateColor();



