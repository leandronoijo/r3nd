module Api
  module V1
    class GreetingsController < ApplicationController
      def index
        render json: {
          greeting: "Hello from Rails API!",
          fact: {
            id: 1,
            text: "Ruby on Rails was created by David Heinemeier Hansson in 2004",
            category: "technology"
          }
        }
      end
    end
  end
end
