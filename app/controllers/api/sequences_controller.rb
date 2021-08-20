module Api
  class SequencesController < Api::AbstractController
    before_action :clean_expired_farm_events, only: [:destroy]

    def index
      render json: sequences
               .to_a
               .map { |s| CeleryScript::FetchCelery.run!(sequence: s) }
    end

    def show
      render json: CeleryScript::FetchCelery.run!(sequence: sequence)
    end

    def create
      mutate Sequences::Create.run(sequence_params, device: current_device)
    end

    def update
      mutate Sequences::Update.run(sequence_params,
                                   device: current_device,
                                   sequence: sequence)
    end

    def destroy
      mutate Sequences::Destroy.run(sequence: sequence, device: current_device)
    end

    def publish
      mutate Sequences::Publish.run(sequence: sequence, device: current_device)
    end

    def unpublish
      raise "WIP"
    end

    def upgrade
      raise "WIP"
    end

    def fork
      raise "WIP"
    end

    private

    def sequence_params
      @sequence_params ||= raw_json[:sequence] || raw_json || {}
    end

    def sequences
      @sequences ||= Sequence.with_usage_reports.where(device: current_device)
    end

    def sequence
      @sequence ||= sequences.find(params[:id])
    end
  end
end
