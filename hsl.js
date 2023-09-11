const hueSlider = document.querySelector("#hue-slider"),
  satSlider = document.querySelector("#sat-slider"),
  lightSlider = document.querySelector("#light-slider"),
  alphaSlider = document.querySelector("#alpha-slider"),
  hexText = document.querySelector(".hex"),
  hslText = document.querySelector(".hsl"),
  colorBox = document.querySelector(".color-box"),
  wheel = document.querySelector("canvas.color-wheel");

function hslToHex(h, s, l) {
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

  hexText.innerHTML = hex;
  colorBox.style.backgroundColor = hsl;
  hslText.innerHTML = hsl;
}

function bindInputs(slider, text, hue = false) {
  max = 100;
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

bindInputs(hueSlider, document.querySelector("#hue-value"), true);
bindInputs(satSlider, document.querySelector("#sat-value"));
bindInputs(lightSlider, document.querySelector("#light-value"));
alphaSlider.addEventListener("input", updateColor);


updateColor();

// new
const radius = 100;
  let ctx = wheel.getContext("2d");
  drawHSLCircle(radius);

  function drawHSLCircle(radius) {
    const image = ctx.createImageData(2 * radius, 2 * radius);
    const data = image.data;
    const rowLength = 2 * radius;
    const pixelWidth = 4; // each pixel requires 4 spaces in the data array (RGBA)
    const alpha = 255;
    const value = 1.0;

    for (let y = -radius; y <= radius; y++) {

        for (let x = -radius; x <= radius; x++) {

        const [distance, theta] = convertCoordinatesToPolar(x, y);

        // process only (x,y) coordinates that are inside circle
        if (distance <= radius) {

            const hue = convertRadiansToDegrees(theta);

            const saturation = distance / radius;

            const [red, green, blue] = hsvToRgb(hue, saturation, value);

            // find index in data array
            const index = ((x + radius) * rowLength + y + radius) * pixelWidth;

            data[index] = red;
            data[index + 1] = green;
            data[index + 2] = blue;
            data[index + 3] = alpha;
        }
      }
    }

    ctx.putImageData(image, 0, 0);
  }

  function convertCoordinatesToPolar(x, y) {
    const radius = Math.sqrt(x * x + y * y);
    const theta = Math.atan2(y, x);
    return [radius, theta];
  }

  // rad in [-π, π] range
  // return degree in [0, 360] range
  function convertRadiansToDegrees(rad) {
      return (rad + Math.PI) * 180 / Math.PI;
}


// hue in range [0, 360]
// saturation, value in range [0,1]
// return [r,g,b] each in range [0,255]
// See: https://en.wikipedia.org/wiki/HSL_and_HSV#From_HSV
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
