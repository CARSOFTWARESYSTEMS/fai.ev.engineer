import json

from sim_003.cli.commands import main


def test_generate_normal_summary_output(capsys):
    exit_code = main(["generate", "--battery-id", "SIM-BAT-CLI", "--scenario", "normal", "--count", "5", "--transport", "in_memory"])
    captured = capsys.readouterr()
    assert exit_code == 0
    assert "status=PASSED" in captured.err
    assert "generated=5 published=5 observed=5" in captured.err


def test_generate_json_output_is_parseable(capsys):
    exit_code = main([
        "generate", "--battery-id", "SIM-BAT-CLI", "--scenario", "normal",
        "--count", "3", "--transport", "in_memory", "--output", "json",
    ])
    captured = capsys.readouterr()
    assert exit_code == 0
    parsed = json.loads(captured.out)
    assert parsed["simulated"] is True
    assert len(parsed["events"]) == 3


def test_generate_invalid_battery_id_returns_nonzero_exit(capsys):
    exit_code = main(["generate", "--battery-id", "NOT-RESERVED", "--scenario", "normal", "--transport", "in_memory"])
    captured = capsys.readouterr()
    assert exit_code == 2
    assert "Invalid request" in captured.err


def test_generate_writes_evidence_files(tmp_path, capsys):
    evidence_dir = tmp_path / "evidence"
    exit_code = main([
        "generate", "--battery-id", "SIM-BAT-CLI", "--scenario", "normal",
        "--count", "2", "--transport", "in_memory", "--evidence-dir", str(evidence_dir),
    ])
    assert exit_code == 0
    files = list(evidence_dir.glob("*"))
    assert any(f.suffix == ".json" for f in files)
    assert any(f.suffix == ".html" for f in files)


def test_help_mentions_synthetic_and_educational(capsys):
    try:
        main(["--help"])
    except SystemExit:
        pass
    captured = capsys.readouterr()
    assert "SYNTHETIC" in captured.out
    assert "EDUCATIONAL_SIMULATION_ONLY" in captured.out
