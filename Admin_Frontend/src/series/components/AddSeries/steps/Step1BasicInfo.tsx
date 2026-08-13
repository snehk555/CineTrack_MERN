import { useState, useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { useDebounce } from '@/hooks/useDebounce';
import { useTmdbTvSearch } from '../../../hooks/seriesQueries';
import { tmdbApi } from '@/movies/services/api';
import { useGenresList } from '@/movies/hooks/moviesQueries';

import '@/movies/components/AddMovie/steps/Step1BasicInfo.css';

interface Props {
  isEditMode?: boolean;
}

const Step1BasicInfo = ({ isEditMode = false }: Props) => {

  const { register, setValue, formState: { errors } } = useFormContext();
  const [tmdbSearch, setTmdbSearch] = useState('');
  const [selectedTmdbId, setSelectedTmdbId] = useState<number | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  
  const debouncedTmdbSearch = useDebounce(tmdbSearch, 500);

  // Queries
  const { data: searchResults, isFetching: isSearching } = useTmdbTvSearch(debouncedTmdbSearch);
  const { data: genresData } = useGenresList();
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch details manually when selected
  useEffect(() => {
    if (selectedTmdbId) {
      const fetchDetails = async () => {
        setIsFetchingDetails(true);
        try {
          const res = await tmdbApi.getDetails(selectedTmdbId, 'tv');
          if (res.success && res.data) {
            const d = res.data;
            setValue('title', d.title, { shouldValidate: true });
            setValue('overview', d.overview, { shouldValidate: true });
            if (d.releaseYear) {
              setValue('releaseYear', d.releaseYear, { shouldValidate: true });
            }
            if (d.averageRating) {
              setValue('averageRating', d.averageRating, { shouldValidate: true });
            }
            if (d.totalRatings) {
              setValue('totalRatings', d.totalRatings);
            }
            if (d.spokenLanguage) {
              const langMap: Record<string, string> = { en: 'English', hi: 'Hindi', ta: 'Tamil', te: 'Telugu', mr: 'Marathi' };
              setValue('spokenLanguage', langMap[d.spokenLanguage] || 'English', { shouldValidate: true });
            }
            if (d.posterPath) setValue('posterPath', d.posterPath);
            if (d.backdropPath) setValue('bannerPath', d.backdropPath);
            if (d.trailerUrl) setValue('trailerUrl', d.trailerUrl);
            setValue('tmdbId', d.tmdbId);
            
            if (d.contentRating) setValue('contentRating', d.contentRating, { shouldValidate: true });
            
            // Cast & Crew Auto-fill
            if (d.directors && d.directors.length > 0) {
              setValue('director', d.directors[0], { shouldValidate: true });
            }
            if (d.cast && d.cast.length > 0) {
              const topCast = d.cast.slice(0, 10).map((actor: any) => ({
                name: actor.name,
                role: actor.character || 'Unknown',
                profilePath: actor.profilePath || null
              }));
              setValue('actors', topCast, { shouldValidate: true });
            }

            // Smart Genre Mapping
            if (d.genres && d.genres.length > 0 && genresData?.data) {
              const tmdbGenreNames = d.genres.map((g: any) => g.name.toLowerCase());
              const matchedDbGenreIds = genresData.data
                .filter((dbGenre: any) => {
                  const dbName = dbGenre.name.toLowerCase();
                  return tmdbGenreNames.some((tmdbName: string) => tmdbName.includes(dbName) || dbName.includes(tmdbName));
                })
                .map((dbGenre: any) => dbGenre._id);
              
              if (matchedDbGenreIds.length > 0) {
                setValue('genreIds', matchedDbGenreIds, { shouldValidate: true });
              }
            }
          }
        } finally {
          setIsFetchingDetails(false);
          setTmdbSearch('');
          setIsDropdownOpen(false);
          setSelectedTmdbId(null);
        }
      };
      fetchDetails();
    }
  }, [selectedTmdbId, setValue, genresData]);

  return (
    <div className="step-container step1-basic-info">
      
      {/* TMDB Search Magic Bar — hidden in edit mode since data is already loaded */}
      {!isEditMode && (
        <div className="tmdb-search-section">
          <div className="tmdb-search-wrapper" ref={searchWrapperRef}>
            <Input 
              placeholder="✨ Search TMDB TV Shows to auto-fill details..."
              value={tmdbSearch}
              onChange={(e) => {
                setTmdbSearch(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="tmdb-search-input"
            />
            {isSearching && <span className="tmdb-spinner">⏳</span>}
            
            {/* Dropdown Results */}
            {isDropdownOpen && debouncedTmdbSearch && searchResults?.success && searchResults.data?.results?.length > 0 && (
              <div className="tmdb-dropdown">
                {searchResults.data.results.slice(0, 5).map((show: any) => (
                  <div 
                    key={show.tmdbId} 
                    className="tmdb-result-item"
                    onClick={() => {
                      setSelectedTmdbId(show.tmdbId);
                    }}
                  >
                    {show.posterPath ? (
                      <img src={show.posterPath.replace('original', 'w92')} alt={show.title} />
                    ) : (
                      <div className="tmdb-no-image">No Img</div>
                    )}
                    <div className="tmdb-result-info">
                      <h4>{show.title}</h4>
                      <span>{show.releaseYear || 'N/A'} • 📺 TV Show</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <hr className="step-divider" />


      {/* Form Fields */}
      <div className="form-grid">
        <Input 
          label="Title *" 
          {...register('title')} 
          error={errors.title?.message as string} 
        />
        
        <div className="form-row">
          <Input 
            label="Release Year *" 
            type="number" 
            {...register('releaseYear', { valueAsNumber: true })} 
            error={errors.releaseYear?.message as string} 
          />
          <Input 
            label="TMDB Rating" 
            type="number" 
            step="0.1"
            {...register('averageRating', { valueAsNumber: true })} 
            error={errors.averageRating?.message as string} 
          />
        </div>

        <Textarea 
          label="Overview *" 
          {...register('overview')} 
          error={errors.overview?.message as string} 
        />

        <div className="form-row">
          <div className="input-group">
            <label className="input-label">Language *</label>
            <select className="input-field" {...register('spokenLanguage')}>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Tamil">Tamil</option>
              <option value="Telugu">Telugu</option>
              <option value="Malayalam">Malayalam</option>
              <option value="Korean">Korean</option>
            </select>
            {errors.spokenLanguage && <span className="input-error">{errors.spokenLanguage.message as string}</span>}
          </div>

          <div className="input-group">
            <label className="input-label">Content Rating *</label>
            <select className="input-field" {...register('contentRating')}>
              <option value="U">U (All Ages)</option>
              <option value="U/A">U/A (Parental Guidance)</option>
              <option value="A">A (Adults Only)</option>
            </select>
            {errors.contentRating && <span className="input-error">{errors.contentRating.message as string}</span>}
          </div>
        </div>
      </div>

      {isFetchingDetails && (
        <div className="loading-overlay">
          <span>Loading TMDB details...</span>
        </div>
      )}
    </div>
  );
};

export default Step1BasicInfo;
