import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useQueryClient } from '@tanstack/react-query';
import { useGenresList, useCategoriesList, useCreateGenre, useCreateCategory } from '../../../hooks/moviesQueries';
import { toast } from 'sonner';
import './Step2Taxonomy.css';

const Step2Taxonomy = () => {
  const { register, watch, setValue, formState: { errors } } = useFormContext();
  const queryClient = useQueryClient();
  
  const { data: genresData, isLoading: isLoadingGenres } = useGenresList();
  const { data: categoriesData } = useCategoriesList();
  
  const { mutate: createGenre, isPending: isCreatingGenre } = useCreateGenre();
  const { mutate: createCategory, isPending: isCreatingCategory } = useCreateCategory();

  const selectedGenres = watch('genreIds') || [];

  const [newGenreName, setNewGenreName] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  const toggleGenre = (genreId: string) => {
    if (selectedGenres.includes(genreId)) {
      setValue('genreIds', selectedGenres.filter((id: string) => id !== genreId), { shouldValidate: true });
    } else {
      setValue('genreIds', [...selectedGenres, genreId], { shouldValidate: true });
    }
  };

  const handleCreateGenre = () => {
    if (!newGenreName.trim()) return;
    createGenre(
      { name: newGenreName.trim() },
      {
        onSuccess: () => {
          toast.success('Genre created');
          setNewGenreName('');
          queryClient.invalidateQueries({ queryKey: ['genres'] });
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create genre')
      }
    );
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    createCategory(
      { name: newCategoryName.trim() },
      {
        onSuccess: (res) => {
          toast.success('Category created');
          setNewCategoryName('');
          queryClient.invalidateQueries({ queryKey: ['categories'] });
          // Auto-select the newly created category
          if (res?.data?._id) {
            setValue('category', res.data._id, { shouldValidate: true });
          }
        },
        onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create category')
      }
    );
  };

  return (
    <div className="step-container step2-taxonomy">
      <div className="genres-section">
        <label className="input-label">Genres * (Select at least one)</label>
        
        {isLoadingGenres ? (
          <div className="genres-loading">Loading genres...</div>
        ) : (
          <div className="genres-grid">
            {genresData?.data?.map((genre: any) => (
              <div 
                key={genre._id}
                className={`genre-badge-selectable ${selectedGenres.includes(genre._id) ? 'selected' : ''}`}
                style={{
                  '--genre-color': genre.color || '#6366f1',
                } as React.CSSProperties}
                onClick={() => toggleGenre(genre._id)}
              >
                {genre.name}
              </div>
            ))}
          </div>
        )}
        {errors.genreIds && <span className="input-error mt-2 d-block">{errors.genreIds.message as string}</span>}
        
        {/* Inline Create Genre */}
        <div className="inline-create-group">
          <Input 
            placeholder="New Genre Name" 
            value={newGenreName} 
            onChange={(e) => setNewGenreName(e.target.value)} 
          />
          <Button type="button" variant="ghost" onClick={handleCreateGenre} disabled={isCreatingGenre || !newGenreName.trim()}>
            {isCreatingGenre ? 'Adding...' : '+ Add'}
          </Button>
        </div>
      </div>

      <hr className="step-divider" />

      <div className="form-grid">
        <Input 
          label="Tags (Comma separated)" 
          placeholder="e.g. superhero, dark, action-packed"
          {...register('tags')} 
          error={errors.tags?.message as string} 
          hint="Helps in search and recommendations"
        />

        <div className="input-group">
          <label className="input-label">Category</label>
          <div className="category-select-wrapper">
            <select className="input-field" {...register('category')}>
              <option value="">Select Category (Optional)</option>
              {categoriesData?.data?.map((cat: any) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          {errors.category && <span className="input-error">{errors.category.message as string}</span>}
          
          {/* Inline Create Category */}
          <div className="inline-create-group" style={{ marginTop: '12px' }}>
            <Input 
              placeholder="New Category Name" 
              value={newCategoryName} 
              onChange={(e) => setNewCategoryName(e.target.value)} 
            />
            <Button type="button" variant="ghost" onClick={handleCreateCategory} disabled={isCreatingCategory || !newCategoryName.trim()}>
              {isCreatingCategory ? 'Adding...' : '+ Add'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step2Taxonomy;
