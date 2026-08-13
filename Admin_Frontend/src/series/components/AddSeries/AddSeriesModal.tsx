import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/ui/Button';
import { toast } from 'sonner';

import { addSeriesSchema, type AddSeriesFormValues } from './schemas';
import { useCreateSeries, useUpdateSeries } from '../../hooks/seriesQueries';

// Forms
import Step1BasicInfo from './steps/Step1BasicInfo';
import Step2Taxonomy from '@/movies/components/AddMovie/steps/Step2Taxonomy'; // Reusing from movies
import Step3CastCrew from '@/movies/components/AddMovie/steps/Step3CastCrew'; // Reusing from movies
import Step4Media from './steps/Step4Media';
import Step5Review from './steps/Step5Review';

import './AddSeriesModal.css';
import '@/movies/components/AddMovie/AddMovieModal.css'; // Contains .add-movie-modal-overlay base styles

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Pass existing series data to switch to Edit Mode */
  editData?: any;
}

const STEPS = [
  { id: 1, label: 'Basic Info' },
  { id: 2, label: 'Taxonomy' },
  { id: 3, label: 'Cast & Crew' },
  { id: 4, label: 'Images' },
  { id: 5, label: 'Review & Submit' },
];

const AddSeriesModal: React.FC<Props> = ({ isOpen, onClose, editData }) => {
  const isEditMode = !!editData;
  const [currentStep, setCurrentStep] = useState(1);
  const { mutate: addSeries, isPending: isCreating } = useCreateSeries();
  const { mutate: updateSeries, isPending: isUpdating } = useUpdateSeries();
  const isPending = isCreating || isUpdating;

  const methods = useForm<AddSeriesFormValues>({
    resolver: zodResolver(addSeriesSchema),
    defaultValues: {
      screenshots: [],
      genreIds: [],
      actors: [],
      status: 'draft',
    },
    mode: 'onTouched'
  });

  // Pre-fill form when editing
  useEffect(() => {
    if (isOpen && editData) {
      methods.reset({
        title: editData.title || '',
        overview: editData.overview || '',
        tmdbId: editData.tmdbId || undefined,
        releaseYear: editData.releaseYear || undefined,
        averageRating: editData.averageRating || undefined,
        spokenLanguage: editData.spokenLanguage || 'English',
        contentRating: editData.contentRating || 'U',
        genreIds: editData.genreIds?.map((g: any) => g._id || g) || [],
        categoryId: editData.categoryId || undefined,
        director: editData.directors?.[0] || editData.director || '',
        actors: editData.cast?.map((c: any) => ({ name: c.name, role: c.character, profilePath: c.profilePath })) || [],
        posterPath: editData.posterPath || '',
        bannerPath: editData.bannerPath || '',
        trailerUrl: editData.trailerUrl || '',
        screenshots: editData.screenshots?.map((s: string) => ({ url: s })) || [],
        status: editData.status || 'draft',
      });
      setCurrentStep(1);
    } else if (isOpen && !editData) {
      methods.reset({
        screenshots: [],
        genreIds: [],
        actors: [],
        status: 'draft',
      });
      setCurrentStep(1);
    }
  }, [isOpen, editData]);

  const handleNext = async () => {
    // Steps 3 (Cast) and 4 (Images) have no required field validation — advance directly
    if (currentStep === 3 || currentStep === 4) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
      return;
    }

    let fieldsToValidate: any[] = [];
    if (currentStep === 1) fieldsToValidate = ['title', 'overview', 'releaseYear'];
    else if (currentStep === 2) fieldsToValidate = ['genreIds', 'categoryId'];

    const isStepValid = await methods.trigger(fieldsToValidate as any);
    if (isStepValid) setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = (data: AddSeriesFormValues) => {
    const payload = {
      ...data,
      directors: data.director ? [data.director] : [],
      cast: data.actors?.map(a => ({ name: a.name, character: a.role, profilePath: a.profilePath })) || [],
    };

    if (isEditMode) {
      updateSeries({ id: editData._id, data: payload }, {
        onSuccess: () => {
          toast.success('Series updated successfully!');
          onClose();
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.message || 'Failed to update series');
        }
      });
    } else {
      addSeries(payload, {
        onSuccess: () => {
          toast.success('Series added successfully!');
          methods.reset();
          setCurrentStep(1);
          onClose();
        },
        onError: (err: any) => {
          const message = err.response?.data?.message || 'Failed to add series';
          toast.error(message);
        }
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="add-movie-modal-overlay">
      <div className="add-movie-modal">
        {/* Header */}
        <div className="add-movie-modal__header">
          <div className="header-title">
            <h2>{isEditMode ? `Edit: ${editData.title}` : 'Add New Web Series'}</h2>
            <p>Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1].label}</p>
          </div>
          <button type="button" className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(currentStep / STEPS.length) * 100}%` }} 
          />
        </div>

        <div className="add-movie-modal__body">
          <FormProvider {...methods}>
            <form onSubmit={(e) => e.preventDefault()} id="add-series-form">
              {currentStep === 1 && <Step1BasicInfo isEditMode={isEditMode} />}
              {currentStep === 2 && <Step2Taxonomy />}
              {currentStep === 3 && <Step3CastCrew />}
              {currentStep === 4 && <Step4Media seriesTmdbId={editData?.tmdbId} />}
              {currentStep === 5 && <Step5Review />}
            </form>
          </FormProvider>
        </div>

        {/* Footer Actions */}
        <div className="wizard-footer">
          <Button type="button" variant="outline" onClick={currentStep === 1 ? onClose : handlePrev}>
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </Button>
          
          <div className="wizard-actions-right">
            {currentStep < STEPS.length ? (
              <Button type="button" onClick={handleNext}>Next Step</Button>
            ) : (
              <Button type="button" onClick={methods.handleSubmit(onSubmit)} loading={isPending}>
                {isEditMode ? 'Save Changes' : 'Create Series'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddSeriesModal;
