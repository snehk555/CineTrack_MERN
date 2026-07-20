import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addMovieSchema, type AddMovieFormValues } from './schemas';
import { useAddMovie } from '../../hooks/moviesQueries';
import Button from '@/components/ui/Button';
import './AddMovieModal.css';

// Placeholder steps (will be implemented in subsequent phases)
import Step1BasicInfo from './steps/Step1BasicInfo';
import Step2Taxonomy from './steps/Step2Taxonomy';
import Step3CastCrew from './steps/Step3CastCrew';
import Step4Media from './steps/Step4Media';
import Step5Video from './steps/Step5Video';
import Step6Review from './steps/Step6Review';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS = [
  'Basic Info',
  'Taxonomy',
  'Cast & Crew',
  'Media',
  'Video',
  'Review & Submit',
];

const AddMovieModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const queryClient = useQueryClient();
  const { mutate: addMovie, isPending } = useAddMovie();

  const methods = useForm<AddMovieFormValues>({
    resolver: zodResolver(addMovieSchema),
    defaultValues: {
      title: '',
      description: '',
      language: 'English',
      contentRating: 'U/A',
      type: 'Movie',
      genreIds: [],
      actors: [],
      status: 'draft',
    },
    mode: 'onChange',
  });

  if (!isOpen) return null;

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    
    // Step-by-step validation logic
    if (currentStep === 1) {
      fieldsToValidate = ['title', 'description', 'releaseYear', 'duration', 'language', 'contentRating', 'type'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['genreIds', 'tags', 'category'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['director', 'actors'];
    } else if (currentStep === 4) {
      fieldsToValidate = ['posterPath', 'bannerPath', 'trailerUrl'];
    }

    if (fieldsToValidate.length > 0) {
      const isValid = await methods.trigger(fieldsToValidate);
      if (!isValid) return; // Prevent going next if current step is invalid
    }

    setCurrentStep((p) => Math.min(p + 1, STEPS.length));
  };

  const prevStep = () => setCurrentStep((p) => Math.max(p - 1, 1));

  const onSubmit = (data: AddMovieFormValues) => {
    // Map frontend form data to match backend schema requirements
    const payload: any = {
      ...data,
      categoryId: data.category,     // backend expects categoryId
      overview: data.description,    // backend expects overview
      runtime: data.duration,        // backend expects runtime
      tmdbId: data.tmdbId || Math.floor(Math.random() * 1000000), // backend requires tmdbId
      cast: data.actors?.map((actor: any) => ({
        name: actor.name,
        character: actor.role,
        profilePath: actor.profilePath,
      })),
    };

    // Remove frontend-only keys
    delete payload.category;
    delete payload.description;
    delete payload.duration;
    delete payload.actors;

    addMovie(payload, {
      onSuccess: () => {
        toast.success(`Movie "${data.title}" added successfully!`);
        queryClient.invalidateQueries({ queryKey: ['admin-movies'] });
        
        // Reset and close
        methods.reset();
        setCurrentStep(1);
        onClose();
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to add movie');
      }
    });
  };

  return (
    <div className="add-movie-modal-overlay">
      <div className="add-movie-modal">
        {/* Header */}
        <div className="add-movie-modal__header">
          <div className="header-title">
            <h2>Add New Movie</h2>
            <p>Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]}</p>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }} 
          />
        </div>

        {/* Content Body */}
        <div className="add-movie-modal__body">
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="add-movie-form">
              <div className="step-content">
                {currentStep === 1 && <Step1BasicInfo />}
                {currentStep === 2 && <Step2Taxonomy />}
                {currentStep === 3 && <Step3CastCrew />}
                {currentStep === 4 && <Step4Media />}
                {currentStep === 5 && <Step5Video />}
                {currentStep === 6 && <Step6Review />}
              </div>
            </form>
          </FormProvider>
        </div>

        {/* Footer Actions */}
        <div className="add-movie-modal__footer">
          <Button variant="ghost" onClick={currentStep === 1 ? onClose : prevStep}>
            {currentStep === 1 ? 'Cancel' : '← Back'}
          </Button>
          
          {currentStep < STEPS.length ? (
            <Button variant="primary" onClick={nextStep}>
              Next Step →
            </Button>
          ) : (
            <Button variant="primary" onClick={methods.handleSubmit(onSubmit)} disabled={isPending}>
              {isPending ? 'Saving...' : 'Finish & Save'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddMovieModal;
