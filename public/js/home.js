/**
 * AI Resume Coach - Home Page Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // Score Counter Animation for Hero Graphic
  const scoreElement = document.getElementById('heroScore') || document.querySelector('.score-number');
  if (scoreElement) {
    let currentScore = 0;
    const targetScore = 82;
    const duration = 1200;
    const stepTime = Math.abs(Math.floor(duration / targetScore));

    const counter = setInterval(() => {
      currentScore += 1;
      scoreElement.textContent = `${currentScore}%`;
      
      if (currentScore >= targetScore) {
        clearInterval(counter);
      }
    }, stepTime);
  }
});
