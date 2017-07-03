port module Karma.Service exposing (KarmaProgram, run, runWithOptions)

import Html
import Random.Pcg as Random
import Test exposing (Test)
import Karma.Html.App as App exposing (..)

type alias KarmaProgram =
    Program Never App.Model App.Msg

type alias ExternalTestReport = {
    success:Maybe Bool,
    infoOnly:Maybe Bool,
    title:String,
    runComplete:Bool,
    testsToRun:Maybe Int

    }

--Ports provide hooks to karma
port sendReport : ExternalTestReport -> Cmd msg
port acknowledge : (Bool -> msg) -> Sub msg

{-| Run the test and report the results.

Fuzz tests use a default run count of 100, and an initial seed based on the
system time when the test runs begin.

-}
run : Test -> KarmaProgram
run =
    runWithOptions Nothing Nothing



{-| Run the test using the provided options. If `Nothing` is provided for either
`runs` or `seed`, it will fall back on the options used in [`run`](#run).
-}
runWithOptions : Maybe Int -> Maybe Random.Seed -> Test -> KarmaProgram
runWithOptions runs seed test =
    Html.program
        { init = App.init (Maybe.withDefault 100 runs) seed (\tr -> case tr of

            --Report total number of tests at start
            Ready testsToRun ->
                sendReport {title = "Ready", success = Nothing, runComplete=False, testsToRun = Just testsToRun, infoOnly = Nothing}
            --Report a pass
            Pass progress ->
                sendReport {title = progress.lastTest, success = Just True, runComplete=False, testsToRun = Nothing, infoOnly = Nothing}
            --Report a fail
            Fail progress ->
                sendReport {title = String.join "\r\n"  [progress.lastTest, progress.failureDescription], success = Just False, runComplete=False, testsToRun = Nothing, infoOnly = Nothing}
            --Report a skipped test or a todo
            InfoOnly progress ->
                sendReport {title = String.join "\r\n"  [progress.lastTest, progress.description], success = Nothing, runComplete=False, testsToRun = Nothing, infoOnly = Just True}
            --Report test run complete
            Done summary ->
                case summary.failureReason of
                    Just reason ->
                        sendReport {title = String.join "\r\n" [summary.message, reason], success = Just False, runComplete=True, testsToRun = Nothing, infoOnly = Nothing}
                    Nothing ->
                        sendReport {title = summary.message, success = Just True, runComplete=True, testsToRun = Nothing, infoOnly = Nothing}

        , acknowledge) test
        , update = App.update
        , view = \model->
            case (App.present model) of
                Just text -> Html.div [] [Html.text text]
                Nothing -> Html.div [] [Html.text "Naffink"]
                
        , subscriptions = App.subscriptions
        }
