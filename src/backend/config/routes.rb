Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      get 'greetings', to: 'greetings#index'
    end
  end

  get "health", to: "health#index"
end
