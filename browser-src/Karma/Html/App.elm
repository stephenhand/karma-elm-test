module Karma.Html.App
    exposing
        ( Model
        , Msg(..)
        , Reporter
        , TestResult(..)
        , init
        , present
        , update
        , subscriptions
        )

import Expect exposing (Expectation)
import Random.Pcg as Random
import Task
import Test exposing (Test)
import Karma.Exploration as Runner exposing (Reason(..))
import Time exposing (Time)


type Model
    = NotStarted (Maybe Random.Seed) Int Reporter Test
    | Started Time Time Reporter Runner.Status


type Msg
    = Dispatch Time
    | Reported Bool

type TestResult
    = Ready Int
    | Pass {testJustRun:List String, done:Int, remaining:Int}
    | Fail {testJustRun:List String, failureDescription:String}
    | InfoOnly {testJustRun:List String, description:String}
    | Done {message:String, failureReason: Maybe String}

type alias Reporter =(TestResult -> Cmd Msg, (Bool -> Msg) -> Sub Msg)



dispatch : Cmd Msg
dispatch =
    Task.perform Dispatch Time.now


start : Int -> Test -> Random.Seed -> Runner.Status
start runs test seed =
    Runner.fromTest runs seed test
        |> Runner.peek


init : Int -> Maybe Random.Seed -> Reporter -> Test -> ( Model, Cmd Msg )
init runs maybeSeed reporter test =
    ( NotStarted maybeSeed runs reporter test, dispatch )

reasonsToDescription: List { given : Maybe String, message : String } -> String
reasonsToDescription reasons = reasons
    |> (List.map (\{message} -> message) )
    |> String.join "\r\n"

statusToTestResult : Runner.Status -> TestResult
statusToTestResult status =
        case status of
            Runner.Running state ->
                case state.testJustRun of
                    Just test->
                         case test.result of
                             Runner.Passed ->
                                 Pass {testJustRun = test.descriptions, done=state.passed, remaining = state.remaining}
                             Runner.Failed reasons ->
                                 Fail {testJustRun = test.descriptions, failureDescription = reasons |> reasonsToDescription}
                             Runner.NotDone (labels, reasons) ->
                                 InfoOnly {testJustRun = test.descriptions, description = String.concat ["TODO: ", reasons |> reasonsToDescription] }
                    Nothing ->
                        Ready state.remaining

            Runner.Pass passed ->
                Done {message = "Passed", failureReason = Nothing}
            Runner.Fail _ failures ->
                Done {message = "Failed", failureReason = Just (failures
                                                            |> List.map toString
                                                            |> String.join "\r\n")}
            Runner.Todo _ failures->
                Done {message = "Todo", failureReason = Just (failures
                                                              |> List.map toString
                                                              |> String.join "\r\n")}
            Runner.AutoFail _ reason ->
                Done {message = "AutoFail", failureReason = (case reason of
                    Custom customString ->
                        Just (toString reason)
                    _ ->
                        Nothing
                        )}
update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        Dispatch now ->
            case model of
                NotStarted Nothing runs (send, acknowledge) test ->
                    let status = floor now
                         |> Random.initialSeed
                         |> start runs test
                    in
                    ( Started now now (send, acknowledge) status
                    , status
                          |> statusToTestResult
                          |> send)

                NotStarted (Just seed) runs (send, acknowledge) test ->
                    let status = start runs test seed
                    in
                    ( Started now now (send, acknowledge) status
                    , status
                        |> statusToTestResult
                        |> send)

                Started startTime _ (send, acknowledge) (Runner.Running state) ->
                    ( Started startTime now (send, acknowledge) (Runner.step state.next)
                    ,(Runner.Running state)
                          |> statusToTestResult
                          |> send
                    )

                Started startTime _ (send, acknowledge) status ->
                    ( Started startTime now (send, acknowledge) status
                    , status
                        |> statusToTestResult
                        |> send
                    )
        Reported success ->
            if success then
                (model, dispatch)
            else
                (model, Cmd.none)


present : Model -> Maybe String
present model =
    case model of
        NotStarted _ _ _ _ ->
            Just "Starting..."

        Started startTime now reporter status ->
            case status of
                Runner.Running state ->
                    case state.testJustRun of
                        Nothing ->
                            Just "Starting.."
                        Just test ->
                            Just (String.concat ["Running: ",  test.descriptions |> String.join " >> " ])
                Runner.Pass passed ->
                    Just (String.concat ["Passed:", toString passed ])
                Runner.Fail _ _ ->
                    Just ("Fail")
                Runner.Todo _ _->
                    Just ("Todo")
                Runner.AutoFail _ _ ->
                    Just ("AutoFail")

subscriptions : Model -> Sub Msg

subscriptions model =
    case model of
        Started _ _ (send, acknowledge) _ ->
            acknowledge Reported
        NotStarted _ _ (send, acknowledge) _ ->
            acknowledge Reported




