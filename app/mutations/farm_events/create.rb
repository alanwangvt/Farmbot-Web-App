module FarmEvents
  class Create < Mutations::Command
    include FarmEvents::ExecutableHelpers
    executable_fields :optional
    BACKWARDS_END_TIME = "This event starts before it ends. Did you flip the "\
                         "start and end times?"

    required do
      model   :device, class: Device
      integer :repeat, min: 1
      string  :time_unit, in: FarmEvent::UNITS_OF_TIME
    end

    optional do
      time :start_time, default: Time.current
      time :end_time
    end

    def validate
      validate_start_and_end if end_time
      validate_executable
    end

    def execute
      p = inputs.merge(executable: executable)
      # Needs to be set this way for cleanup operations:
      p[:end_time] = (p[:start_time] + 1.minute) if is_one_time_event
      FarmEvent.create!(p)
    end

    def validate_start_and_end
      if (start_time > end_time) && !is_one_time_event
        add_error :end_time, :backwards, BACKWARDS_END_TIME
      end
    end

    def is_one_time_event
      time_unit == FarmEvent::NEVER
    end
  end
end
