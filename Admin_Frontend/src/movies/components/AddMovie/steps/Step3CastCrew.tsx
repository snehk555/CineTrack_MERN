import { useFormContext, useFieldArray } from 'react-hook-form';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import './Step3CastCrew.css';

const Step3CastCrew = () => {
  const { register, control, watch, formState: { errors } } = useFormContext();
  
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'actors',
  });

  return (
    <div className="step-container step3-cast-crew">
      
      <div className="director-section">
        <h3 className="section-title">Crew</h3>
        <Input 
          label="Director" 
          placeholder="e.g. Christopher Nolan"
          {...register('director')} 
          error={errors.director?.message as string} 
        />
      </div>

      <hr className="step-divider" />

      <div className="cast-section">
        <div className="cast-header">
          <h3 className="section-title">Cast / Actors</h3>
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => append({ name: '', role: '' })}
            className="add-actor-btn"
          >
            + Add Actor
          </Button>
        </div>

        {fields.length === 0 ? (
          <div className="empty-cast">
            <p>No actors added yet. Click "+ Add Actor" to start.</p>
          </div>
        ) : (
          <div className="actors-list">
            {fields.map((field, index) => {
              const actorErrors = (errors.actors as any)?.[index];
              const profilePath = watch(`actors.${index}.profilePath`);
              const imgUrl = profilePath ? 
                (profilePath.startsWith('http') ? profilePath : `https://image.tmdb.org/t/p/w200${profilePath}`) 
                : null;
              
              return (
                <div key={field.id} className="actor-card">
                  <div className="actor-photo-wrapper">
                    {imgUrl ? (
                      <img src={imgUrl} alt="Actor" className="actor-photo" />
                    ) : (
                      <span className="actor-photo-placeholder">No Img</span>
                    )}
                  </div>
                  
                  <div className="actor-inputs">
                    <Input 
                      placeholder="Actor Name (e.g. Christian Bale)"
                      {...register(`actors.${index}.name` as const)} 
                      error={actorErrors?.name?.message} 
                    />
                    <Input 
                      placeholder="Character Role (e.g. Bruce Wayne)"
                      {...register(`actors.${index}.role` as const)} 
                      error={actorErrors?.role?.message} 
                    />
                    {/* Hidden input to store profile path */}
                    <input type="hidden" {...register(`actors.${index}.profilePath` as const)} />
                  </div>
                  <button 
                    type="button" 
                    className="remove-actor-btn"
                    onClick={() => remove(index)}
                    title="Remove Actor"
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default Step3CastCrew;
