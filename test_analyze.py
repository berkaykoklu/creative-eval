"""Checks on the statistics. Known inputs with an answer you can work out by hand."""

import numpy as np
import pytest

from analyze import ranks, spearman


def test_ties_share_the_average_rank() -> None:
    # Three values tied at the bottom hold ranks 0,1,2 -> all get 1.0.
    assert list(ranks(np.array([5.0, 5.0, 5.0, 9.0]))) == [1.0, 1.0, 1.0, 3.0]


def test_a_perfect_ordering_scores_one_and_a_reversed_one_minus_one() -> None:
    a = np.array([1.0, 2.0, 3.0, 4.0])

    assert spearman(a, np.array([10.0, 20.0, 30.0, 40.0])) == pytest.approx(1.0)
    assert spearman(a, np.array([40.0, 30.0, 20.0, 10.0])) == pytest.approx(-1.0)


def test_it_measures_order_not_distance() -> None:
    # Spearman is chosen precisely so this is 1.0: the ordering is identical,
    # even though the second series is wildly non-linear. Pearson would not be.
    a = np.array([1.0, 2.0, 3.0, 4.0])
    b = np.array([1.0, 2.0, 3.0, 4000.0])

    assert spearman(a, b) == pytest.approx(1.0)


def test_a_constant_column_reports_nan_rather_than_a_number() -> None:
    # A metric that returned the same value for every image tells us nothing.
    # Saying so beats emitting a correlation that looks like a finding.
    assert np.isnan(spearman(np.array([1.0, 1.0, 1.0]), np.array([1.0, 2.0, 3.0])))
