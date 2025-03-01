// preloader.js

// List of all image filenames in the "img" folder.
const imageFilenames = [
  "random.jpg",
  "random5.jpg",
  "random4.jpg",
  "random3.jpg",
  "random2.jpg",
  "random.png",
  "josh.jpg",
  "josh2.jpg",
  "miguel.jpeg",
  "randi.png",
  "randi2.gif"
];

const preloadedImages = [];

function preloadImages() {
  let loadedCount = 0;
  const totalImages = imageFilenames.length;
  const loadingText = document.getElementById("loadingText");

  imageFilenames.forEach((filename) => {
    const img = new Image();
    img.onload = () => {
      loadedCount++;
      updateProgress();
    };
    img.onerror = () => {
      console.error(`Error preloading image: ${filename}`);
      loadedCount++;
      updateProgress();
    };
    img.src = `img/${filename}`;
    preloadedImages.push(img);
  });

  function updateProgress() {
    const percent = Math.floor((loadedCount / totalImages) * 100);
    loadingText.textContent = `Loading... ${percent}%`;
    if (loadedCount === totalImages) {
      console.log("All images preloaded!");
      const loadingScreen = document.getElementById("loadingScreen");
      loadingScreen.classList.add("fade-out");
      setTimeout(() => {
        loadingScreen.classList.add("hidden");
        document.getElementById("introScreen").classList.remove("hidden");
      }, 1000);
    }
  }
}

document.addEventListener("DOMContentLoaded", preloadImages);
