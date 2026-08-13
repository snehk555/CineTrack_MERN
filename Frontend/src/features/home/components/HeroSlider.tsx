import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFeaturedFeed } from '../../feed/hooks/feedQueries';

export default function HeroSlider() {
  const { data: featuredItems, isLoading } = useFeaturedFeed();
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!featuredItems || featuredItems.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [featuredItems]);

  if (isLoading || !featuredItems || featuredItems.length === 0) {
    return null;
  }

  const currentItem = featuredItems[currentIndex];
  
  const backdropUrl = currentItem.backdropPath
    ? (currentItem.backdropPath.startsWith('http')
        ? currentItem.backdropPath
        : `https://image.tmdb.org/t/p/original${currentItem.backdropPath}`)
    : currentItem.posterPath 
      ? (currentItem.posterPath.startsWith('http')
          ? currentItem.posterPath
          : `https://image.tmdb.org/t/p/original${currentItem.posterPath}`)
      : '';

  const isSeries = 'totalSeasons' in currentItem;
  const targetUrl = isSeries ? `/series/${currentItem._id}` : `/movies/${currentItem._id}`;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16/9',
        maxHeight: '80vh',
        minHeight: '500px',
        overflow: 'hidden',
        marginBottom: '2rem',
        backgroundColor: '#000',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${backdropUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'top center',
          backgroundRepeat: 'no-repeat',
          transition: 'background-image 0.5s ease-in-out',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 40%)',
        }}
      />

      <div
        style={{
          position: 'absolute',
          bottom: '10%',
          left: '5%',
          width: '90%',
          maxWidth: '600px',
          zIndex: 10,
        }}
      >
        <h1
          style={{
            fontSize: '3rem',
            fontWeight: 800,
            color: '#fff',
            marginBottom: '0.5rem',
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            lineHeight: 1.1,
          }}
        >
          {currentItem.title}
        </h1>
        
        <p
          style={{
            color: '#ccc',
            fontSize: '1rem',
            marginBottom: '1.5rem',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {currentItem.overview || "Experience this critically acclaimed masterpiece now streaming."}
        </p>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => navigate(targetUrl)}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1.1rem',
              fontWeight: 600,
              backgroundColor: '#eab308',
              color: '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'transform 0.2s, background-color 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.backgroundColor = '#facc15';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = '#eab308';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch Now
          </button>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          right: '5%',
          display: 'flex',
          gap: '8px',
          zIndex: 10,
        }}
      >
        {featuredItems.map((_, idx) => (
          <div
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            style={{
              width: currentIndex === idx ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              backgroundColor: currentIndex === idx ? '#eab308' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
