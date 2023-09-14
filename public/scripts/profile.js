const spotifyButton = document.querySelector('.spotify');
const spotifyContainer = document.querySelector('.spotify-container');
const ytButton = document.querySelector('.youtube');
const ytContainer = document.querySelector('.youtube-container');

spotifyButton.addEventListener('mouseover', () => {
  spotifyContainer.style.backgroundColor = '#252525'; 
  setTimeout(() => {
    spotifyButton.textContent = 'Connect';
  }, 50);
});

spotifyButton.addEventListener('mouseout', () => {
  spotifyContainer.style.backgroundColor = '#1ed760'; 
  setTimeout(() => {
    spotifyButton.textContent = 'Spotify';
  }, 50);
});

ytButton.addEventListener('mouseover', () => {
    ytContainer.style.backgroundColor = '#252525'; 
    setTimeout(() => {
      ytButton.textContent = 'Connect';
    }, 100);
    
});
  
ytButton.addEventListener('mouseout', () => {
    ytContainer.style.backgroundColor = 'orangered'; 
    setTimeout(() => {
      ytButton.textContent = 'Youtube';
    }, 100);
});