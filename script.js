import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

// NOTE: These values are interconnected - when speed changes, it affects when images finish their movement, which also affects the gap between images. When you change the number of items in spotlightItems array, you'll need to adjust these config settings together. Test different combinations until you find the right balance that looks good.
const config = {
  gap: 0.12,
  speed: 0.35,
  arcRadius: 500,
};

const MOD_PREMIUM = 500;

// Base prices from Casio India MRP (incl. of all taxes):
// DW-291H-1AV   https://www.casio.com/in/watches/casio/product.DW-291H-1AV/   → ₹3,595
// AE-1200WHD-1AV https://www.casio.com/in/watches/casio/product.AE-1200WHD-1AV/ → ₹3,995
// WS-1700H-5AV  https://www.casio.com/in/watches/casio/product.WS-1700H-5AV/  → ₹2,995
// A158WA-1      https://www.casio.com/in/watches/casio/product.A158WA-1/      → ₹1,895
const spotlightItems = [
  {
    name: "Casio DW-291H",
    img: "/casio-dw-291h.png",
    price: 3595,
    isMod: false,
  },
  {
    name: "Casio DW-291H Red",
    img: "/casio-dw-291h-red.png",
    price: 3595,
    isMod: true,
  },
  {
    name: "Casio AE-1200WHD",
    img: "/casio-ae-1200whd-1av.png",
    price: 3995,
    isMod: false,
  },
  {
    name: "Casio AE-1200WHD Yellow",
    img: "/casio-ae-1200whd.png",
    price: 3995,
    isMod: true,
  },
  {
    name: "Casio WS-1700H-5AV",
    img: "/casio-ws-1700h.png",
    price: 2995,
    isMod: false,
  },
  {
    name: "Casio A158WA-1",
    img: "/casio-a158wa-1.png",
    price: 1895,
    isMod: false,
  },
];

const catalogPairs = [
  {
    name: "Casio DW-291H",
    price: 3595,
    normal: {
      img: "/casio-dw-291h.png",
      label: "Standard",
    },
    mod: {
      img: "/casio-dw-291h-red.png",
      label: "Red filter",
    },
  },
  {
    name: "Casio AE-1200WHD",
    price: 3995,
    normal: {
      img: "/casio-ae-1200whd-1av.png",
      label: "Standard",
    },
    mod: {
      img: "/casio-ae-1200whd.png",
      label: "Yellow filter",
    },
  },
];

const catalogSingles = [
  {
    name: "Casio WS-1700H-5AV",
    img: "/casio-ws-1700h.png",
    price: 2995,
  },
  {
    name: "Casio A158WA-1",
    img: "/casio-a158wa-1.png",
    price: 1895,
  },
];

function formatInr(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);

const titlesContainer = document.querySelector(".spotlight-titles");
const imagesContainer = document.querySelector(".spotlight-images");
const spotlightHeader = document.querySelector(".spotlight-header");
const titlesContainerElement = document.querySelector(
  ".spotlight-titles-container"
);
const introTextElements = document.querySelectorAll(".spotlight-intro-text");
const scrollHint = document.querySelector(".scroll-hint");
const imageElements = [];

ScrollTrigger.create({
  trigger: ".hero",
  start: "top top",
  end: "bottom top",
  scrub: true,
  onUpdate: (self) => {
    if (!scrollHint) return;
    gsap.set(scrollHint, {
      opacity: Math.max(0, 1 - self.progress * 1.8),
      y: self.progress * 20,
    });
  },
});

spotlightItems.forEach((item, index) => {
  const titleElement = document.createElement("h1");
  titleElement.textContent = item.name;
  if (index === 0) titleElement.style.opacity = "1";
  titlesContainer.appendChild(titleElement);

  const imgWrapper = document.createElement("div");
  imgWrapper.className = "spotlight-img";
  const imgElement = document.createElement("img");
  imgElement.src = item.img;
  imgElement.alt = "";
  imgWrapper.appendChild(imgElement);
  imagesContainer.appendChild(imgWrapper);
  imageElements.push(imgWrapper);
});

const catalogList = document.querySelector(".catalog-list");

function createVariantColumn({ img, label, price, isMod }) {
  const col = document.createElement("div");
  col.className = `catalog-variant${isMod ? " is-mod" : ""}`;

  const thumb = document.createElement("img");
  thumb.src = img;
  thumb.alt = label;
  thumb.className = "catalog-thumb";

  const meta = document.createElement("div");
  meta.className = "catalog-variant-meta";

  const kind = document.createElement("span");
  kind.className = "catalog-tag";
  kind.textContent = label;

  meta.appendChild(kind);

  if (price != null) {
    const amount = document.createElement("p");
    amount.className = "catalog-price";
    amount.textContent = formatInr(price);
    meta.appendChild(amount);
  }

  col.appendChild(thumb);
  col.appendChild(meta);
  return col;
}

catalogPairs.forEach((pair) => {
  const li = document.createElement("li");
  li.className = "catalog-item catalog-item-pair";

  const heading = document.createElement("p");
  heading.className = "catalog-name";
  heading.textContent = pair.name;

  const columns = document.createElement("div");
  columns.className = "catalog-columns";
  columns.appendChild(
    createVariantColumn({
      img: pair.normal.img,
      label: pair.normal.label,
      price: pair.price,
      isMod: false,
    })
  );
  columns.appendChild(
    createVariantColumn({
      img: pair.mod.img,
      label: pair.mod.label,
      price: pair.price + MOD_PREMIUM,
      isMod: true,
    })
  );

  li.appendChild(heading);
  li.appendChild(columns);
  catalogList.appendChild(li);
});

catalogSingles.forEach((item) => {
  const li = document.createElement("li");
  li.className = "catalog-item catalog-item-single";

  const thumb = document.createElement("img");
  thumb.src = item.img;
  thumb.alt = item.name;
  thumb.className = "catalog-thumb";

  const meta = document.createElement("div");
  meta.className = "catalog-meta";

  const name = document.createElement("p");
  name.className = "catalog-name";
  name.textContent = item.name;

  const price = document.createElement("p");
  price.className = "catalog-price";
  price.textContent = formatInr(item.price);

  meta.appendChild(name);
  meta.appendChild(price);
  li.appendChild(thumb);
  li.appendChild(meta);
  catalogList.appendChild(li);
});

const titleElements = titlesContainer.querySelectorAll("h1");
let currentActiveIndex = 0;

function getArcPoints() {
  const isMobile = window.innerWidth <= 1000;
  const containerHeight = window.innerHeight;
  const imgOffsetX = isMobile ? 50 : 80;
  const imgOffsetY = isMobile ? 75 : 120;
  const arcRadius = isMobile
    ? Math.min(config.arcRadius, window.innerWidth * 0.55)
    : config.arcRadius;
  const arcStartX = isMobile
    ? window.innerWidth * 0.5
    : window.innerWidth * 0.3 - 220;
  const arcStartY = -200;
  const arcEndY = containerHeight + 200;
  const arcControlPointX = arcStartX + arcRadius;
  const arcControlPointY = containerHeight / 2;

  return {
    arcStartX,
    arcStartY,
    arcEndY,
    arcControlPointX,
    arcControlPointY,
    imgOffsetX,
    imgOffsetY,
  };
}

function getBezierPosition(t) {
  const {
    arcStartX,
    arcStartY,
    arcEndY,
    arcControlPointX,
    arcControlPointY,
  } = getArcPoints();
  const x =
    (1 - t) * (1 - t) * arcStartX +
    2 * (1 - t) * t * arcControlPointX +
    t * t * arcStartX;
  const y =
    (1 - t) * (1 - t) * arcStartY +
    2 * (1 - t) * t * arcControlPointY +
    t * t * arcEndY;
  return { x, y };
}

function getImgProgressState(index, overallProgress) {
  const startTime = index * config.gap;
  const endTime = startTime + config.speed;

  if (overallProgress < startTime) return -1;
  if (overallProgress > endTime) return 2;

  return (overallProgress - startTime) / config.speed;
}

imageElements.forEach((img) => gsap.set(img, { opacity: 0 }));

ScrollTrigger.create({
  trigger: ".spotlight",
  start: "top top",
  end: () => `+=${window.innerHeight * 6}px`,
  pin: true,
  pinSpacing: true,
  scrub: 1,
  invalidateOnRefresh: true,
  onUpdate: (self) => {
    const progress = self.progress;

    if (progress <= 0.2) {
      const animationProgress = progress / 0.2;

      const moveDistance = window.innerWidth * 0.6;
      gsap.set(introTextElements[0], {
        x: -animationProgress * moveDistance,
      });
      gsap.set(introTextElements[1], {
        x: animationProgress * moveDistance,
      });
      gsap.set(introTextElements[0], { opacity: 1 });
      gsap.set(introTextElements[1], { opacity: 1 });

      gsap.set(".spotlight-bg-img", {
        transform: `scale(${animationProgress})`,
      });
      gsap.set(".spotlight-bg-img img", {
        transform: `scale(${1.5 - animationProgress * 0.5})`,
      });

      imageElements.forEach((img) => gsap.set(img, { opacity: 0 }));
      spotlightHeader.style.opacity = "0";
      gsap.set(titlesContainerElement, {
        "--before-opacity": "0",
        "--after-opacity": "0",
      });
    } else if (progress > 0.2 && progress <= 0.25) {
      gsap.set(".spotlight-bg-img", { transform: "scale(1)" });
      gsap.set(".spotlight-bg-img img", { transform: "scale(1)" });

      gsap.set(introTextElements[0], { opacity: 0 });
      gsap.set(introTextElements[1], { opacity: 0 });

      imageElements.forEach((img) => gsap.set(img, { opacity: 0 }));
      spotlightHeader.style.opacity = "1";
      gsap.set(titlesContainerElement, {
        "--before-opacity": "1",
        "--after-opacity": "1",
      });
    } else if (progress > 0.25 && progress <= 0.95) {
      gsap.set(".spotlight-bg-img", { transform: "scale(1)" });
      gsap.set(".spotlight-bg-img img", { transform: "scale(1)" });

      gsap.set(introTextElements[0], { opacity: 0 });
      gsap.set(introTextElements[1], { opacity: 0 });

      spotlightHeader.style.opacity = "1";
      gsap.set(titlesContainerElement, {
        "--before-opacity": "1",
        "--after-opacity": "1",
      });

      const switchProgress = (progress - 0.25) / 0.7;
      const viewportHeight = window.innerHeight;
      const titlesContainerHeight = titlesContainer.scrollHeight;
      const startPosition = viewportHeight;
      const targetPosition = -titlesContainerHeight;
      const totalDistance = startPosition - targetPosition;
      const currentY = startPosition - switchProgress * totalDistance;

      gsap.set(".spotlight-titles", {
        transform: `translateY(${currentY}px)`,
      });

      imageElements.forEach((img, index) => {
        const imageProgress = getImgProgressState(index, switchProgress);

        if (imageProgress < 0 || imageProgress > 1) {
          gsap.set(img, { opacity: 0 });
        } else {
          const pos = getBezierPosition(imageProgress);
          const { imgOffsetX, imgOffsetY } = getArcPoints();
          gsap.set(img, {
            x: pos.x - imgOffsetX,
            y: pos.y - imgOffsetY,
            opacity: 1,
          });
        }
      });

      const viewportMiddle = viewportHeight / 2;
      let closestIndex = 0;
      let closestDistance = Infinity;

      titleElements.forEach((title, index) => {
        const titleRect = title.getBoundingClientRect();
        const titleCenter = titleRect.top + titleRect.height / 2;
        const distanceFromCenter = Math.abs(titleCenter - viewportMiddle);

        if (distanceFromCenter < closestDistance) {
          closestDistance = distanceFromCenter;
          closestIndex = index;
        }
      });

      if (closestIndex !== currentActiveIndex) {
        if (titleElements[currentActiveIndex]) {
          titleElements[currentActiveIndex].style.opacity = "0.25";
        }
        titleElements[closestIndex].style.opacity = "1";
        currentActiveIndex = closestIndex;
      }
    } else if (progress > 0.95) {
      spotlightHeader.style.opacity = "0";
      gsap.set(titlesContainerElement, {
        "--before-opacity": "0",
        "--after-opacity": "0",
      });
    }
  },
});
