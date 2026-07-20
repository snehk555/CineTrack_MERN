import { useFormContext, useFieldArray } from 'react-hook-form';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import './Step3CastCrew.css';

const Step3CastCrew = () => {
  const { register, control, formState: { errors } } = useFormContext();
  
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
              // Extract error safely
              const actorErrors = (errors.actors as any)?.[index];
              
              return (
                <div key={field.id} className="actor-row">
                  <div className="actor-inputs">
                    <Input 
                      placeholder="Actor Name (e.g. Christian Bale)"
                      {...register(`actors.${index}.name` as const)} 
                      error={actorErrors?.name?.message} 
                    />
                    <Input 
                      placeholder="Character Role (e.g. Bruce Wayne / Batman)"
                      {...register(`actors.${index}.role` as const)} 
                      error={actorErrors?.role?.message} 
                    />
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
