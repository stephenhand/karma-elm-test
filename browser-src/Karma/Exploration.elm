module Karma.Exploration
    exposing
        ( Failure
        , Reason(..)
        , Runner
        , Result(..)
        , Status(..)
        , fromTest
        , step
        , peek
        )

import Expect
import Random.Pcg
import Test
import Test.Runner


type Runner
    = Runner Internals


type alias Internals =
    { passed : Int
    , failures : List Failure
    , todos : List Failure
    , queue : List Test.Runner.Runner
    , autoFail : Maybe Reason
    }

type Result
    = Passed
    | Failed (List { given : Maybe String, message : String })
    | NotDone Failure

type Status
    = Running
        { passed : Int
        , remaining : Int
        , failures : List Failure
        , next : Runner
        , testJustRun : Maybe {
                descriptions:List String,
                result:Result
            }
        }
    | Pass Int 
    | Fail Int (List Failure)
    | Todo Int (List Failure)
    | AutoFail Int Reason


type Reason
    = Skip
    | Only
    | Custom String


type alias Failure =
    ( List String, List { given : Maybe String, message : String } )


fromTest : Int -> Random.Pcg.Seed -> Test.Test -> Runner
fromTest runs seed test =
    let
        new queue autoFail =
            Runner
                { passed = 0
                , failures = []
                , todos = []
                , queue = queue
                , autoFail = autoFail
                }
    in
    case Test.Runner.fromTest runs seed test of
        Test.Runner.Plain queue ->
            new queue Nothing

        Test.Runner.Only queue ->
            new queue (Just Only)

        Test.Runner.Skipping queue ->
            new queue (Just Skip)

        Test.Runner.Invalid reason ->
            new [] (Just (Custom reason))


step : Runner -> Status
step runner =
    statusFromRunner runner (\(Runner internals) next queue ->
        next.run ()
            |> fromExpectation { internals | queue = queue } next.labels)

peek : Runner -> Status

peek runner =
    statusFromRunner runner (\(Runner internals) _ _ ->
                                Running { passed = internals.passed
                                     , remaining = List.length internals.queue
                                     , failures = internals.failures
                                     , next = Runner internals
                                     , testJustRun = Nothing
                                    })


statusFromRunner:Runner -> (Runner -> Test.Runner.Runner -> List Test.Runner.Runner -> Status) -> Status
statusFromRunner (Runner internals)  whileRunning =
    case
        ( internals.autoFail
        , internals.todos
        , internals.failures
        , internals.queue
        )
    of
        ( Nothing, [], [], [] ) ->
            Pass internals.passed

        ( Nothing, todos, [], [] ) ->
            Todo internals.passed todos

        ( Just reason, _, [], [] ) ->
            AutoFail internals.passed reason

        ( _, _, failures, [] ) ->
            Fail internals.passed failures

        ( _, _, _, next :: queue ) ->
            whileRunning (Runner internals) next queue

fromExpectation : Internals -> List String -> List Expect.Expectation -> Status
fromExpectation internals labels expectations =
    let
        ( todos, failures ) =
            List.foldr partition ( [], [] ) expectations

        partition e old =
            case ( Test.Runner.isTodo e, Test.Runner.getFailure e ) of
                ( True, Just result ) ->
                    Tuple.mapFirst ((::) result) old

                ( False, Just result ) ->
                    Tuple.mapSecond ((::) result) old

                ( _, Nothing ) ->
                    old
    in
    if List.isEmpty failures && List.isEmpty todos then
        toRunning
            { internals
                | passed = internals.passed + 1
            }
            labels
            Passed

    else if List.isEmpty failures then
        toRunning
            { internals
                | todos = internals.todos ++ [ ( labels, todos ) ]
            }
            labels
            (NotDone ( labels, todos ))
    else
        toRunning
            { internals
                | failures = internals.failures ++ [ ( labels, failures ) ]
            }
            labels
            (Failed  failures )

toRunning : Internals -> List String -> Result -> Status
toRunning internals labels result =
    Running
        { passed = internals.passed
        , remaining = List.length internals.queue
        , failures = internals.failures
        , next = Runner internals
        , testJustRun = Just {
            descriptions = labels,
            result = result
            }
        }